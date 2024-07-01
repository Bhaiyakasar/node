const OrderModel = require("../schema/order.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const CustomerModel = require("../schema/customer.schema");
const CategoryModel = require("../schema/category.schema");
const ServiceModel = require("../schema/services.schema");
const BusinessModel = require("../schema/bussiness.schema");
const InventoryModel = require("../schema/inventry.schema");
const WarehouseModel = require("../schema/warehouse.schema");
const PaymentHistoryModel = require('../schema/paymenthistory.schema');
const WidgetsModel = require('../schema/widgets.schema');
const UserWidgetsModel = require("../schema/userwidgets.schema");
const status = require("../config/status");
const Paid = status.PAID;
const Credit = status.CREDIT;
const Cancelled = status.CANCELLED;
const PartiallyPaid = status.PARTIALLYPAID;
const logger = require('../config/logger');
const Log = require('../schema/log.schema');
const { log } = require("winston");
const Counter = require("../schema/counter.schema");

class OrderService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async createOrderAndDecrementInventory(req, orderData) {
        try {
            let totalPaidAmount = 0;
            if (!orderData.wareHouseId) {
                const searchFilter = {
                    groupId: orderData.groupId
                };

                const latitude = parseFloat(req.body.location.coordinates[0]);
                const longitude = parseFloat(req.body.location.coordinates[1]);

                if (!isNaN(latitude) && !isNaN(longitude)) {
                    searchFilter.location = {
                        $nearSphere: {
                            $geometry: {
                                type: "Point",
                                coordinates: [longitude, latitude]
                            }
                        }
                    };
                }

                const nearestWarehouse = await WarehouseModel.findOne(searchFilter);

                if (!nearestWarehouse) {
                    throw new Error("No warehouse found near the provided coordinates.");
                }

                orderData.wareHouseId = nearestWarehouse.wareHouseId;
            }

            const productCodeQuantityMap = new Map();
            for (const orderDetail of orderData.orderDetails) {
                const productcode = orderDetail.product.productcode;
                const quantity = orderDetail.quantity;
                const name = orderDetail.product.name;
                productCodeQuantityMap.set(productcode, { quantity, name });
            }

            const updatedInventory = [];
            for (const [productcode, { quantity }] of productCodeQuantityMap) {

                const inventory = await InventoryModel.findOne({
                    groupId: orderData.groupId,
                    'warehouse.wareHouseId': orderData.wareHouseId,
                    productcode: productcode
                }).sort({ createdAt: 1 });

                if (!inventory) {
                    throw new Error(`Inventory not found for product`);
                }

                const newQuantity = inventory.quantity - quantity;
                await InventoryModel.updateOne({ _id: inventory._id }, { quantity: newQuantity });
                updatedInventory.push({ productcode, quantity: newQuantity });
            }

            const counter = await Counter.findByIdAndUpdate(
                { _id: 'invoiceNo' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            const invoiceNumber = counter.seq;
            const invoiceNo = invoiceNumber.toString().padStart(6, '0');
            orderData.invoiceNo = invoiceNo;

            const createdOrder = await OrderModel.create(orderData);

            if (orderData.paymentInfo) {
                totalPaidAmount = orderData.tokenAmount || 0;
                const paymentHistory = new PaymentHistoryModel({
                    groupId: orderData.groupId,
                    orderId: createdOrder.orderId,
                    userId: orderData.userId,
                    onlineTxnId: orderData.paymentInfo.OnlineTxnId,
                    bankName: orderData.paymentInfo.bankName,
                    chequeAmount: orderData.paymentInfo.chequeAmount,
                    upi: orderData.paymentInfo.upi,
                    txnId: orderData.paymentInfo.txnId,
                    chequeNo: orderData.paymentInfo.chequeNo,
                    paymentStatus: orderData.paymentInfo.paymentStatus,
                    chequeDate: orderData.paymentInfo.chequeDate,
                    chequeAmount: orderData.paymentInfo.chequeAmount,
                    creditPaymentDate: orderData.paymentInfo.creditPaymentDate,
                    paidAmount: orderData.tokenAmount || 0,
                    totalPaidAmount: totalPaidAmount,
                    remainingAmount: orderData.RemainingAmount,
                    paymentDateTime: orderData.paymentInfo.paymentDateTime,
                    mode: orderData.paymentInfo.mode,
                    pictures: orderData.paymentInfo.pictures,

                });

                await paymentHistory.save();

            }

            await OrderModel.findByIdAndUpdate(createdOrder._id, { updatedInventory, totalPaidAmount });
            const updatedOrder = await OrderModel.findById(createdOrder._id);

            return { status: "Success", data: updatedOrder };
        } catch (error) {
            throw error;
        }
    }

    async orderCount(groupId, userId, start_date, end_date, filters = {}) {
        try {
            const widget = await WidgetsModel.findOne({ name: "order" }).lean().exec();

            const userWidget = await UserWidgetsModel.findOne({ groupId: groupId, userId: userId, widgetId: widget.widgetId }).lean().exec();

            if (userWidget && !userWidget.isDashboardVisible) {
                return {
                    message: "You do not have visibility to view Order count.",

                };
            }

            let query = { groupId, deleted: { $ne: true } };

            if (start_date !== undefined && end_date !== undefined) {
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);
                endDate.setUTCHours(23, 59, 59, 999);

                query.orderDate = {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString(),
                };
            }
            if (filters.department) {
                query.department = { $regex: filters.department, $options: 'i' };
            }
            const orders = await OrderModel.find(query);

            if (orders.length === 0) {
                return {
                    Orders: 0,
                    TotalSale: 0,
                    ReceivedAmount: 0,
                    PendingAmount: 0,
                    Taxes: 0,
                    Profit: 0,
                    Paid: 0,
                    PartiallyPaid: 0,
                    Credit: 0,
                    Products: 0
                };
            }

            let totalSale = 0;
            let receivedAmount = 0;
            let pendingAmount = 0;
            let totalBuyingPrice = 0;
            let totalRegularPrice = 0;
            let totalTax = 0;
            let paidCount = 0;
            let partiallyPaid = 0;
            let credit = 0;
            let productCount = 0;

            orders.forEach(order => {
                totalSale += order.totalCartPrice;
                order.orderDetails.forEach(orderDetail => {
                    const quantity = parseInt(orderDetail.quantity) || 0;
                    totalBuyingPrice += quantity * orderDetail.product.buyingPrice;
                    totalRegularPrice += quantity * orderDetail.product.regularPrice;
                    totalTax += quantity * orderDetail.product.tax;
                });

                if (order.paymentInfo.paymentStatus === Paid) {
                    receivedAmount += order.totalCartPrice;
                    paidCount++;
                } else if (order.paymentInfo.paymentStatus === PartiallyPaid) {
                    receivedAmount += (order.totalCartPrice - order.RemainingAmount);
                    pendingAmount += order.RemainingAmount;
                    partiallyPaid++;
                } else if (order.paymentInfo.paymentStatus === Credit) {
                    pendingAmount += order.totalCartPrice;
                    credit++;
                }
                productCount += order.totalProductQuantity;
            });

            const orderCount = orders.length;
            const profit = (totalRegularPrice + totalTax) - totalBuyingPrice;

            return {
                Orders: orderCount,
                TotalSale: parseFloat(totalSale.toFixed(2)),
                ReceivedAmount: parseFloat(receivedAmount.toFixed(2)),
                PendingAmount: parseFloat(pendingAmount.toFixed(2)),
                Taxes: parseFloat(totalTax.toFixed(2)),
                Profit: parseFloat(profit.toFixed(2)),
                Paid: paidCount,
                PartiallyPaid: partiallyPaid,
                Credit: credit,
                Products: productCount
            };
        } catch (error) {
            console.error('Error counting orders:', error);
            throw new Error('Error counting orders: ' + error.message);
        }
    }

    async getAllDataByGroupId(groupId, criteria) {
        try {
            const query = { groupId: groupId };

            const orQueries = [];

            if (criteria.orderId) {
                const numericOrderId = Number(criteria.orderId);
                if (!isNaN(numericOrderId)) {
                    orQueries.push({ orderId: numericOrderId });
                }
            }
            if (criteria.userId) {
                const numericUserId = Number(criteria.userId);
                if (!isNaN(numericUserId)) {
                    orQueries.push({ userId: numericUserId });
                }
            }

            if (criteria.cartId) orQueries.push({ cartId: criteria.cartId });
            if (criteria.shippingId) orQueries.push({ shippingId: criteria.shippingId });

            if (orQueries.length > 0) {
                query.$and = orQueries;
            }

            const limit = parseInt(criteria.limit) || 10;
            const page = parseInt(criteria.page) || 1;

            const totalCount = await OrderModel.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);

            const data = await OrderModel.find(query)
                .sort({ createdAt: -1 })
                .skip(limit * (page - 1))
                .limit(limit)
                .lean();

            if (data.length === 0) {
                return {
                    data: {
                        items: [],
                    },
                    totalItemsCount: totalCount,
                    totalPages: totalPages,
                };
            }

            const userIds = data.map((item) => item.userId);
            const userData = await CustomerModel.find({
                userId: { $in: userIds },
            }).lean();

            const result = data.map((item) => {
                const user = userData.find((u) => u.userId === item.userId) || {};

                const userResponse = {
                    userId: user.userId || null,
                    phoneNumber: user.phoneNumber || null,
                    name: user.name || null,
                    emailId: user.emailId || null,
                    membership: user.memberMembership || null,
                    location: user.location || null,
                    pinCode: user.pinCode || null,
                };

                const formattedOrderDetails = item.orderDetails.map((orderDetail) => {
                    const formattedTotalProductPrice = parseFloat(orderDetail.totalProductPrice?.toFixed(2) || 0);
                    const formattedTax = parseFloat(orderDetail.product?.tax?.toFixed(2) || 0);
                    return {
                        ...orderDetail,
                        totalProductPrice: formattedTotalProductPrice,
                        product: {
                            ...orderDetail.product,
                            tax: formattedTax,
                        },
                    };
                });

                const formattedTaxes = parseFloat(item.taxes?.toFixed(2) || 0);
                const formattedRemainingAmount = parseFloat(item.RemainingAmount?.toFixed(2) || 0);

                return {
                    ...item,
                    userId: userResponse,
                    taxes: formattedTaxes,
                    RemainingAmount: formattedRemainingAmount,
                    orderDetails: formattedOrderDetails,
                };
            });

            return {
                data: {
                    items: result,
                },
                totalItemsCount: totalCount,
                totalPages: totalPages,
            };
        } catch (error) {
            console.log(error);
            throw new Error("Error encountered while processing data: " + error.message);
        }
    }

    async updateOrder(orderId, data) {
        try {
            const resp = await OrderModel.findOneAndUpdate(
                { orderId: orderId },
                data,
                { upsert: true, new: true }
            );
            return new ServiceResponse({
                data: resp,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    async getByorderId(orderId) {
        return this.execute(async () => {
            try {
                let orderData = await this.model.findOne({ orderId: orderId });
                console.log(orderData.orderDetails);
                const totalIGST = orderData.orderDetails.reduce((total, order) => total + order.product.igst * order.quantity, 0);
                const totalIcgst = orderData.orderDetails.reduce((total, order) => total + order.product.cgst * order.quantity, 0);

                const totalIsgst = orderData.orderDetails.reduce((total, order) => total + order.product.sgst * order.quantity, 0);

                // Log the total IGST amount
                console.log("Total IGST Amount:", totalIGST);

                if (!orderData) {
                    return null;
                }

                let userData = await CustomerModel.findOne({
                    userId: orderData.userId,
                });
                // console.log(userData);

                if (!userData) {
                    return null;
                }
                const result = {
                    ...orderData.toObject(),

                    userId: {
                        custId: userData.custId,
                        groupId: userData.groupId,
                        userId: userData.userId,
                        phoneNumber: userData.phoneNumber,
                        name: userData.name,
                    },
                    igst: totalIGST,
                    cgst: totalIcgst,
                    sgst: totalIsgst
                };

                return result;
            } catch (error) {
                console.error("Error in getByorderId:", error);
                throw error;
            }
        });
    }

    async getAllOrder(filters) {
        try {
            const {
                groupId, start_date, end_date, name, phoneNumber, department, userId, handledBy, assignedTo, year, month, categoryId, orderId, status, paymentStatus, search, page = 1, limit = 10
            } = filters;

            const query = {
                groupId,
                status: { $nin: ["archive"] },
                deleted: { $nin: [true] }
            };

            const orQueries = [];

            if (name) orQueries.push({ name: { $regex: name, $options: 'i' } });
            if (userId) orQueries.push({ userId });
            if (handledBy) orQueries.push({ handledBy });
            if (assignedTo) orQueries.push({ assignedTo: { $regex: assignedTo, $options: 'i' } });
            if (phoneNumber) orQueries.push({ phoneNumber });
            if (department) orQueries.push({ department: { $regex: department, $options: 'i' } });
            if (year) orQueries.push({ orderDate: { $regex: new RegExp(`.*${year}.*`, "i") } });
            if (month) orQueries.push({ orderDate: { $regex: new RegExp(`-${month.padStart(2, '0')}-`, "i") } });
            if (categoryId) orQueries.push({ categoryId });
            if (orderId && !isNaN(Number(orderId))) orQueries.push({ orderId: Number(orderId) });
            if (status) orQueries.push({ status });
            if (paymentStatus) orQueries.push({ "paymentInfo.paymentStatus": paymentStatus });
            if (search) {
                const numericSearch = parseInt(search);
                const searchRegex = { $regex: new RegExp(`.*${search}.*`, "i") };
                const searchCriteria = {
                    $or: [
                        { name: searchRegex },
                        { assignedTo: searchRegex },
                        { "paymentInfo.paymentStatus": searchRegex }
                    ]
                };
                if (!isNaN(numericSearch)) {
                    Object.assign(searchCriteria.$or[0], { phoneNumber: numericSearch });
                    Object.assign(searchCriteria.$or[1], { orderId: numericSearch });
                }
                orQueries.push(searchCriteria);
            }

            if (orQueries.length > 0) query.$and = orQueries;

            if (start_date !== undefined && end_date !== undefined) {
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);
                endDate.setUTCHours(23, 59, 59, 999);

                query.orderDate = {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString(),
                };
            }

            const [totalCount, orders, orderStats] = await Promise.all([
                OrderModel.countDocuments(query),
                OrderModel.find(query)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                this.orderStatusCount(query)
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            const result = await Promise.all(orders.map(async (order) => {
                const [category, subcategory, business, user] = await Promise.all([
                    CategoryModel.findOne({ categoryId: order.categoryId }),
                    ServiceModel.findOne({ subcategoryId: order.subcategoryId }),
                    BusinessModel.findOne({ businessId: order.businessId }),
                    CustomerModel.findOne({ userId: order.userId })
                ]);

                const subcategoryResponse = subcategory ? { name: subcategory.name, subcategoryId: subcategory.subcategoryId, categoryId: subcategory.categoryId, desc: subcategory.desc } : { name: '', subcategoryId: '', categoryId: '', desc: '' };
                const businessResponse = business ? { businessId: business.businessId, name: business.name, categoryId: business.categoryId, listener: business.listener, location: business.location, subGroupId: business.subGroupId } : { name: '', categoryId: '', listener: [], location: '', subGroupId: '' };
                const userResponse = user ? { phoneNumber: user.phoneNumber, name: user.name, userId: user.userId, membership: user.memberMembership, location: user.location, pinCode: user.pinCode } : null;

                return {
                    ...order,
                    userId: userResponse,
                    subcategoryId: subcategoryResponse,
                    businessId: businessResponse,
                };
            }));

            return {
                message: "Success",
                data: {
                    items: result,
                    Orders: orderStats.Orders,
                    TotalSale: orderStats.TotalSale,
                    ReceivedAmount: orderStats.ReceivedAmount,
                    PendingAmount: orderStats.PendingAmount,
                    Taxes: orderStats.Taxes,
                    Profit: orderStats.Profit,
                    Paid: orderStats.Paid,
                    PartiallyPaid: orderStats.PartiallyPaid,
                    Credit: orderStats.Credit,
                    Products: orderStats.Products,
                    cancelled: orderStats.Cancelled
                },
                totalItemsCount: totalCount,
                totalPages: totalPages,
            };
        } catch (error) {
            console.log(error);
            throw new Error('Error encountered while processing service requests: ' + error.message);
        }
    }

    async orderStatusCount(query) {
        try {
            const orders = await OrderModel.find(query);
            if (orders.length === 0) {
                return {
                    Orders: 0,
                    TotalSale: 0,
                    ReceivedAmount: 0,
                    PendingAmount: 0,
                    Taxes: 0,
                    Profit: 0,
                    Paid: 0,
                    PartiallyPaid: 0,
                    Credit: 0,
                    Products: 0,
                    Cancelled: 0
                };
            }

            let totalSale = 0;
            let receivedAmount = 0;
            let pendingAmount = 0;
            let totalBuyingPrice = 0;
            let totalRegularPrice = 0;
            let totalTax = 0;
            let paidCount = 0;
            let partiallyPaid = 0;
            let credit = 0;
            let productCount = 0;
            let cancelledCount = 0;

            orders.forEach(order => {
                if (order.status === Cancelled) {
                    cancelledCount++;
                    return;
                }
                totalSale += order.totalCartPrice;
                order.orderDetails.forEach(orderDetail => {
                    const quantity = parseInt(orderDetail.quantity) || 0;
                    totalBuyingPrice += quantity * orderDetail.product.buyingPrice;
                    totalRegularPrice += quantity * orderDetail.product.regularPrice;
                    totalTax += quantity * orderDetail.product.tax;
                });

                if (order.paymentInfo.paymentStatus === Paid) {
                    receivedAmount += order.totalCartPrice;
                    paidCount++;
                } else if (order.paymentInfo.paymentStatus === PartiallyPaid) {
                    receivedAmount += (order.totalCartPrice - order.RemainingAmount);
                    pendingAmount += order.RemainingAmount;
                    partiallyPaid++;
                } else if (order.paymentInfo.paymentStatus === Credit) {
                    pendingAmount += order.totalCartPrice;
                    credit++;
                }
                productCount += order.totalProductQuantity;
            });

            const orderCount = orders.filter(order => order.status !== Cancelled).length;
            const profit = (totalRegularPrice + totalTax) - totalBuyingPrice;

            return {
                Orders: orderCount,
                TotalSale: parseFloat(totalSale.toFixed(0)),
                ReceivedAmount: parseFloat(receivedAmount.toFixed(0)),
                PendingAmount: parseFloat(pendingAmount.toFixed(0)),
                Taxes: parseFloat(totalTax.toFixed(2)),
                Profit: parseFloat(profit.toFixed(2)),
                Paid: paidCount,
                PartiallyPaid: partiallyPaid,
                Credit: credit,
                Products: parseFloat(productCount.toFixed(0)),
                Cancelled: cancelledCount // Include CancelledOrders in the return object
            };
        } catch (error) {
            console.error('Error counting orders:', error);
            throw new Error('Error counting orders: ' + error.message);
        }
    }


    async countInprogressServiceRequestByGroup(groupId) {
        try {
            // Find documents with a specific groupId
            const groupQuery = {
                groupId: groupId,
                // event: { $ne: "order" },
                // deleted: { $nin: [true] },
                // status: { $ne: "archive" },
            };

            const groupDocs = await OrderModel.find(groupQuery);
            console.log(groupDocs);
            if (!groupDocs || groupDocs.length === 0) {
                return {
                    status: "Success",
                    data: {
                        items: {
                            inprogress: 0,
                        },
                        totalItemsCount: 0,
                    },
                };
            }
            const inprogressCount = groupDocs.filter(
                (doc) => doc.status === "inprogress"
            ).length;
            const newCount = groupDocs.filter(
                (doc) => doc.status === "new"
            ).length;
            const dispatchedCount = groupDocs.filter(
                (doc) => doc.status === "dispatched"
            ).length;

            const intransitCount = groupDocs.filter(
                (doc) => doc.status === "intransit"
            ).length;

            const deliveredCount = groupDocs.filter(
                (doc) => doc.status === "delivered"
            ).length;
            const completedCount = groupDocs.filter(
                (doc) => doc.status === "completed"
            ).length;
            const canceledCount = groupDocs.filter(
                (doc) => doc.status === "canceled"
            ).length;
            const returnCount = groupDocs.filter(
                (doc) => doc.status === "return"
            ).length;

            return {
                status: "Success",
                data: {
                    items: {
                        inprogress: inprogressCount,
                        new: newCount,
                        dispatched: dispatchedCount,
                        intransit: intransitCount,
                        delivered: deliveredCount,
                        completedCount: completedCount,
                        canceled: canceledCount,
                        return: returnCount,
                    },
                    totalItemsCount: groupDocs.length,
                },
            };
        } catch (error) {
            console.error(
                "Error counting in-progress service requests:",
                error
            );
            throw new Error(
                "Error counting in-progress service requests: " + error.message
            );
        }
    }

    async getByCustId(custId) {
        return this.execute(() => {
            return this.model.findOne({ custId: custId });
        });
    }

    async deleteDataById(groupId, orderIds, userId, req) {
        try {
            const orderIdsArray = Array.isArray(orderIds) ? orderIds : [orderIds];

            const leads = await OrderModel.updateMany(
                { groupId, orderId: { $in: orderIdsArray } },
                { $set: { deleted: true } },
                { new: true }
            );

            logger.info({
                method: req.method,
                url: req.originalUrl,
                message: `Order ${orderIdsArray} for group ${groupId} is deletd successfully.`,
                user: userId,
                userIp: req.ip,
                timestamp: new Date().toISOString(),
                body: orderIdsArray
            });

            const newLog = new Log({
                method: req.method,
                url: req.originalUrl,
                message: `Order ${orderIdsArray} for group ${groupId} is updated successfully.`,
                user: userId,
                userIp: req.ip,
                timestamp: new Date().toISOString(),
                body: orderIdsArray
            });

            await newLog.save();

            return leads;
        } catch (error) {
            logger.error({
                method: req.method,
                url: req.originalUrl,
                message: `this error get for this group ${groupId} of order ${orderIdsArray}`,
                body: req.body,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                error: true
            });
            throw error;
        }
    }

    async doesOrderExist(groupId, orderId) {
        try {
            const order = await OrderModel.findOne({
                orderId: orderId,
                groupId: groupId,
            });
            return !!order;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async updateOrderByOrderId(groupId, orderId, userId, data, req) {
        try {
            const existingOrder = await OrderModel.findOne({ orderId: orderId, groupId: groupId });

            let { paymentInfo = {}, tokenAmount, ...otherUpdates } = data;
            let { paymentStatus } = paymentInfo;

            let updatedFields;

            if (paymentInfo && Object.keys(paymentInfo).length > 0) {
                let paidAmount = existingOrder.paidAmount || 0;
                let remainingAmount = existingOrder.RemainingAmount || existingOrder.TotalCardPrice;

                if (tokenAmount) {
                    paidAmount += tokenAmount;
                    remainingAmount -= tokenAmount;
                    if (remainingAmount < 0) {
                        remainingAmount = 0;
                    }
                }

                updatedFields = {
                    paymentInfo: paymentInfo,
                    paidAmount: paidAmount,
                    RemainingAmount: remainingAmount,
                    totalPaidAmount: existingOrder.totalPaidAmount + tokenAmount,
                    ...otherUpdates
                };

                const paymentHistory = new PaymentHistoryModel({
                    groupId: groupId,
                    orderId: orderId,
                    receivedBy: userId,
                    userId: existingOrder.userId,
                    onlineTxnId: paymentInfo.OnlineTxnId,
                    bankName: paymentInfo.bankName,
                    chequeAmount: paymentInfo.chequeAmount,
                    chequeDate: paymentInfo.chequeDate,
                    upi: paymentInfo.upi,
                    txnId: paymentInfo.txnId,
                    chequeNo: paymentInfo.chequeNo,
                    creditPaymentDate: paymentInfo.creditPaymentDate,
                    paymentStatus: paymentStatus,
                    paidAmount: tokenAmount || 0,
                    totalPaidAmount: existingOrder.totalPaidAmount + tokenAmount,
                    remainingAmount: remainingAmount,
                    paymentDateTime: new Date().toISOString(),
                    mode: paymentInfo.mode,
                    pictures: paymentInfo.pictures
                });

                await paymentHistory.save();
            } else {
                updatedFields = {
                    ...otherUpdates
                };
            }

            const updatedOrder = await OrderModel.findOneAndUpdate(
                { orderId: orderId, groupId: groupId },
                updatedFields,
                { upsert: true, new: true }
            );

            logger.info({
                method: req.method,
                url: req.originalUrl,
                message: `Order ${orderId} for group ${groupId} is updated successfully.`,
                user: userId,
                userIp: req.ip,
                timestamp: new Date().toISOString(),
                body: updatedFields
            });

            const newLog = new Log({
                method: req.method,
                url: req.originalUrl,
                message: `Order ${orderId} for group ${groupId} is updated successfully.`,
                user: userId,
                userIp: req.ip,
                timestamp: new Date().toISOString(),
                body: updatedFields
            });

            await newLog.save();

            return new ServiceResponse({
                data: updatedOrder,
            });
        } catch (error) {
            logger.error({
                method: req.method,
                url: req.originalUrl,
                message: `this error get for this group ${groupId} of order ${orderId}`,
                body: req.body,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                error: true
            });
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

}

module.exports = new OrderService(OrderModel, "order");