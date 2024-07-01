const PurchaseOrderModel = require("../schema/purchaseorder.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const QuotationModul = require("../schema/productsquotation.schema");
const SupplierModule = require("../schema/supplier.schema");
const ProductsModel = require("../schema/products.schema");
const IntentModule = require("../schema/intent.schema");
const WarehouseModule = require("../schema/warehouse.schema");
const Counter = require("../schema/counter.schema");

class PurchaseOrderService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async createPurchaseOrder(data) {
        try {
            const { groupId, quotation } = data;

            const existingPurchaseOrder = await PurchaseOrderModel.findOne({ groupId, quotation });
            if (existingPurchaseOrder) {
                return {
                    status: "failed",
                    message: `A purchase order already exists for this quotation ${quotation}`
                };
            }

            const counter = await Counter.findByIdAndUpdate(
                { _id: 'purchaseOrderId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            const purchaseOrderIdNumber = counter.seq;
            const purchaseOrderId = purchaseOrderIdNumber.toString().padStart(6, '0');
            data.purchaseOrderId = purchaseOrderId;

            const createdPurchaseOrder = await PurchaseOrderModel.create(data);

            return {
                status: "success",
                message: "Purchase order created successfully",
                data: createdPurchaseOrder
            };
        } catch (error) {
            console.error(error);
            return {
                status: "failed",
                message: error.message
            };
        }
    }

    async getQuotationByGroupId(groupId, quotationId, page = 1, pageSize = 30) {
        try {
            let purchaseOrders;

            if (quotationId) {
                purchaseOrders = await PurchaseOrderModel.find({ groupId, quotation: quotationId })
                    .skip((page - 1) * pageSize)
                    .limit(Number(pageSize))
                    .sort({ createdAt: -1 })
                    .exec();
            } else {
                purchaseOrders = await PurchaseOrderModel.find({ groupId })
                    .skip((page - 1) * pageSize)
                    .limit(Number(pageSize))
                    .sort({ createdAt: -1 })
                    .exec();
            }

            if (!purchaseOrders || purchaseOrders.length === 0) {
                throw new Error("Purchase order(s) not found", 404);
            }

            const responseData = [];

            for (const purchaseOrder of purchaseOrders) {
                const quotation = await QuotationModul.findOne({ groupId, quotationId: purchaseOrder.quotation });

                if (!quotation) {
                    const purchaseOrderId = purchaseOrder.purchaseOrderId;
                    throw new Error(`quotation not found for purchase Order with ID ${purchaseOrderId}`, 404);
                }

                const supplier = await SupplierModule.findOne({ groupId, supplierId: quotation.supplier });

                if (!supplier) {
                    const purchaseOrderId = purchaseOrder.purchaseOrderId;
                    throw new Error(`Supplier not found for purchase Order with ID ${purchaseOrderId}, Supplier ID: ${quotation.supplier}`, 404);
                }

                const intent = await IntentModule.findOne({ groupId, intentId: quotation.intent });

                if (!intent) {
                    const intentId = quotation.intent;
                    const purchaseOrderId = purchaseOrder.purchaseOrderId;
                    throw new Error(`Intent not found for purchase Order with ID ${purchaseOrderId}, Intent ID: ${intentId}`, 404);
                }

                const warehouse = await WarehouseModule.findOne({ groupId, wareHouseId: intent.warehouseId });
                const products = await Promise.all(quotation.products.map(async product => {
                    const productDetail = await ProductsModel.findOne({ groupId, productcode: product.product });
                    const totalAmount = product.perUnit * product.qty;
                    const taxAmount = (totalAmount * product.tax) / 100;
                    const totalPriceExcludingTax = totalAmount + taxAmount;

                    return {
                        product: {
                            productcode: productDetail.productcode,
                            name: productDetail.name,
                            hsnNo: productDetail.hsnNo
                        },
                        qty: product.qty,
                        perUnit: product.perUnit,
                        unit: product.unit,
                        totalAmount,
                        tax: product.tax,
                        taxAmount,
                        totalPriceExcludingTax
                    };
                }));

                const purchaseOrderDetails = purchaseOrder.toObject();
                delete purchaseOrderDetails._id;

                const response = {
                    ...purchaseOrderDetails,
                    quotation: {
                        quotationId: quotation.quotationId,
                        quotationDate: quotation.quotationDate,
                        intent: {
                            intentId: intent.intentId,
                            warehouse: {
                                WareHouseName: warehouse.WareHouseName,
                                locationName: warehouse.locationName,
                                pinCode: warehouse.pinCode,
                                location: warehouse.location
                            },
                            expecteDeliveryDate: intent.expecteDeliveryDate
                        },
                        shippingDetails: quotation.shippingDetails,
                        supplier: {
                            supplierId: supplier.supplierId,
                            name: supplier.name,
                            addresses: supplier.addresses,
                            phoneNumber: supplier.phoneNumber,
                            email: supplier.email,
                            gstNo: supplier.gstNo,
                            accountDetails: supplier.accountDetails
                        },
                        products,
                        totalProductQty: products.reduce((acc, curr) => acc + curr.qty, 0),
                        totalTax: products.reduce((acc, curr) => acc + curr.tax, 0),
                        totalTaxAmount: products.reduce((acc, curr) => acc + curr.taxAmount, 0),
                        totalProductAmount: products.reduce((acc, curr) => acc + curr.totalAmount, 0),
                        totalProductPriceExcludingTax: products.reduce((acc, curr) => acc + curr.totalPriceExcludingTax, 0)
                    }
                };

                responseData.push(response);
            }

            return {
                status: "data fetched successfully",
                data: {
                    items: responseData,
                    totalItemsCount: responseData.length
                }
            };
        } catch (error) {
            console.error(error);
            throw new Error(error.message, error.status);
        }
    }

    async updateByGroupIdAndPurchaseOrderId(groupId, purchaseOrderId, updatedData) {
        try {
            const purchaseOrder = await this.model.findOneAndUpdate(
                { groupId, purchaseOrderId },
                { $set: updatedData },
                { new: true }
            );

            if (!purchaseOrder) {
                throw new Error("Purchase order not found", 404);
            }

            return {
                status: "Purchase order updated successfully",
                data: purchaseOrder
            };
        } catch (error) {
            console.error(error);
            throw new Error("Internal server error", 500);
        }
    }

}

module.exports = new PurchaseOrderService(PurchaseOrderModel, 'purchaseorder');