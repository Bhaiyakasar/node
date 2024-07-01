const ServicerequestModel = require("../schema/servicerequest.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const CategoryModel = require("../schema/category.schema");
const ServiceModel = require("../schema/services.schema");
const CustomerModel = require("../schema/customer.schema")
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const BusinessModel = require("../schema/bussiness.schema");
const WidgetsModel = require("../schema/widgets.schema");
const UserWidgetsModel = require("../schema/userwidgets.schema");

class ServicerequestService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getAllData(name, phoneNumber, userId, assignedTo, groupId, servicerequestId, year, month, categoryId, status, search, page, limit, handledById) {
        try {
            let query = { groupId: groupId, status: { $nin: ["archive"] }, event: { $ne: "order" }, deleted: { $nin: [true] } };
            const orQueries = [];

            if (name) orQueries.push({ name: { $regex: name, $options: 'i' } });
            if (assignedTo) orQueries.push({ assignedTo: { $regex: assignedTo, $options: 'i' } });
            if (userId) orQueries.push({ userId: userId });
            if (phoneNumber) orQueries.push({ phoneNumber: phoneNumber });
            if (servicerequestId) orQueries.push({ servicerequestId: servicerequestId });
            if (year) orQueries.push({ DateTime: { $regex: new RegExp(`.*${year}.*`, "i") } });
            if (month) {
                const regexMonth = new RegExp(`-${month.padStart(2, '0')}-`, "i");
                orQueries.push({ DateTime: { $regex: regexMonth } });
            }

            if (categoryId) orQueries.push({ categoryId: categoryId });
            if (status) orQueries.push({ status: status });
            if (handledById) orQueries.push({ handledById: handledById });

            if (search) {
                const numericSearch = parseInt(search);
                const searchRegex = { $regex: new RegExp(`.*${search}.*`, "i") };

                const isNumeric = !isNaN(numericSearch);

                if (isNumeric) {
                    orQueries.push({
                        $or: [
                            { name: searchRegex },
                            { title: searchRegex },
                            { phoneNumber: numericSearch },
                            { servicerequestId: numericSearch }
                        ]
                    });
                } else {
                    orQueries.push({
                        $or: [
                            { name: searchRegex },
                            { title: searchRegex },
                        ]
                    });
                }
            }

            if (orQueries.length > 0) {
                query.$and = orQueries;
            }

            const totalCount = await ServicerequestModel.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);

            const servicerequests = await ServicerequestModel.find(query)
                .sort({ createdAt: -1 })
                .skip(limit * (page - 1))
                .limit(limit)
                .lean();

            const result = await Promise.all(servicerequests.map(async (servicerequest) => {
                const [category, subcategory, business, user] = await Promise.all([
                    CategoryModel.findOne({ categoryId: servicerequest.categoryId }),
                    ServiceModel.findOne({ subcategoryId: servicerequest.subcategoryId }),
                    BusinessModel.findOne({ businessId: servicerequest.businessId }),
                    CustomerModel.findOne({ userId: servicerequest.userId })
                ]);

                const categoryResponse = category ? { categoryId: category.categoryId, name: category.name } : { categoryId: '', name: '' };
                const subcategoryResponse = subcategory ? { name: subcategory.name, subcategoryId: subcategory.subcategoryId, categoryId: subcategory.categoryId, desc: subcategory.desc } : { name: '', subcategoryId: '', categoryId: '', desc: '' };
                const businessResponse = business ? { businessId: business.businessId, name: business.name, categoryId: business.categoryId, listener: business.listener, location: business.location, subGroupId: business.subGroupId } : { name: '', categoryId: '', listener: [], location: '', subGroupId: '' };
                const userResponse = user ? { phoneNumber: user.phoneNumber, name: user.name, userId: user.userId, membership: user.memberMembership, location: user.location, pinCode: user.pinCode } : null;

                return {
                    ...servicerequest,
                    userId: userResponse,
                    categoryId: categoryResponse,
                    subcategoryId: subcategoryResponse,
                    businessId: businessResponse,
                };
            }));

            return {
                data: result,
                totalItemsCount: totalCount,
                totalPages: totalPages
            };
        } catch (error) {
            console.error('Error encountered while processing service requests:', error.message);
            throw new Error('Error encountered while processing service requests: ' + error.message);
        }
    }

    async getAllOrder(name, phoneNumber, userId, groupId, servicerequestId, year, month, categoryId, orderId, status, search, page, limit) {
        try {
            let query = { groupId: groupId, status: { $nin: ["archive"] }, event: 'order', deleted: { $nin: [true] } };
            const orQueries = [];

            if (name) orQueries.push({ name: { $regex: name, $options: 'i' } });
            if (userId) orQueries.push({ userId: userId });
            if (phoneNumber) orQueries.push({ phoneNumber: phoneNumber });
            if (servicerequestId) orQueries.push({ servicerequestId: servicerequestId });
            if (year) orQueries.push({ DateTime: { $regex: new RegExp(`.*${year}.*`, "i") } });
            if (month) {
                const regexMonth = new RegExp(`-${month.padStart(2, '0')}-`, "i");
                orQueries.push({ DateTime: { $regex: regexMonth } });
            }
            if (categoryId) orQueries.push({ categoryId: categoryId });
            if (orderId) {
                const numericOrderId = Number(orderId);
                if (!isNaN(numericOrderId)) {
                    orQueries.push({ orderId: numericOrderId });
                }
            }
            if (status) orQueries.push({ status: status });

            if (search) {
                const numericSearch = parseInt(search);
                const searchRegex = { $regex: new RegExp(`.*${search}.*`, "i") };

                const isNumeric = !isNaN(numericSearch);

                if (isNumeric) {
                    orQueries.push({
                        $or: [
                            { name: searchRegex },
                            { title: searchRegex },
                            { phoneNumber: numericSearch },
                            { servicerequestId: numericSearch },
                            { orderId: numericSearch },
                            { assignedTo: searchRegex }
                        ]
                    });
                } else {
                    orQueries.push({
                        $or: [
                            { name: searchRegex },
                            { title: searchRegex },
                            { assignedTo: searchRegex }
                        ]
                    });
                }
            }

            if (orQueries.length > 0) {
                query.$and = orQueries;
            }

            const totalCount = await ServicerequestModel.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);

            const servicerequests = await ServicerequestModel.find(query)
                .sort({ createdAt: -1 })
                .skip(limit * (page - 1))
                .limit(limit)
                .lean();

            const result = await Promise.all(servicerequests.map(async (servicerequest) => {
                const [category, subcategory, business, user] = await Promise.all([
                    CategoryModel.findOne({ categoryId: servicerequest.categoryId }),
                    ServiceModel.findOne({ subcategoryId: servicerequest.subcategoryId }),
                    BusinessModel.findOne({ businessId: servicerequest.businessId }),
                    CustomerModel.findOne({ userId: servicerequest.userId })
                ]);

                const categoryResponse = category ? { categoryId: category.categoryId, name: category.name } : { categoryId: '', name: '' };
                const subcategoryResponse = subcategory ? { name: subcategory.name, subcategoryId: subcategory.subcategoryId, categoryId: subcategory.categoryId, desc: subcategory.desc } : { name: '', subcategoryId: '', categoryId: '', desc: '' };
                const businessResponse = business ? { businessId: business.businessId, name: business.name, categoryId: business.categoryId, listener: business.listener, location: business.location, subGroupId: business.subGroupId } : { name: '', categoryId: '', listener: [], location: '', subGroupId: '' };
                const userResponse = user ? { phoneNumber: user.phoneNumber, name: user.name, userId: user.userId, membership: user.memberMembership, location: user.location, pinCode: user.pinCode } : null;

                return {
                    ...servicerequest,
                    userId: userResponse,
                    subcategoryId: subcategoryResponse,
                    businessId: businessResponse,
                };
            }));

            return {
                data: {
                    items: result
                },
                totalItemsCount: totalCount,
                totalPages: totalPages
            };
        } catch (error) {
            console.error('Error encountered while processing service requests:', error.message);
            throw new Error('Error encountered while processing service requests: ' + error.message);
        }
    }


    async deleteDataById(groupId, servicerequestId) {
        try {
            const updatedServicerequestData = await ServicerequestModel.updateMany(
                {
                    groupId: groupId,
                    servicerequestId: { $in: servicerequestId },
                },
                { $set: { deleted: true } }
            );

            return updatedServicerequestData;
        } catch (error) {
            throw error;
        }
    }

    async countServiceRequestByGroupAndDate(groupId, userId, startDate, endDate) {
        try {
            const widget = await WidgetsModel.findOne({ name: "service request" }).lean().exec();

            if (!widget) {
                throw new Error("Widget not found");
            }

            const userWidget = await UserWidgetsModel.findOne({ groupId: groupId, userId: userId, widgetId: widget.widgetId }).lean().exec();

            if (userWidget && !userWidget.isDashboardVisible) {
                return {
                    message: "You do not have visibility to view service request count.",
                };
            }

            const aggregateStatusCounts = [
                {
                    $match: {
                        groupId: groupId,
                        DateTime: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        event: { $ne: "order" },
                        deleted: { $nin: [true] },
                        status: { $ne: "archive" },
                        $expr: { $eq: ["$userId", "$handledById"] }
                    },
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ];

            const statusCounts = await ServicerequestModel.aggregate(aggregateStatusCounts);

            const formattedStatusCounts = {
                "inprogress": 0,
                "new": 0,
                "open": 0,
                "blocked": 0,
                "completed": 0,
                "rejected": 0,
                "close": 0
            };

            let totalItemsCount = 0;

            statusCounts.forEach((item) => {
                formattedStatusCounts[item._id] = item.count;
                totalItemsCount += item.count;
            });

            return {
                status: "Success",
                data: {
                    items: formattedStatusCounts,
                    totalItemsCount: totalItemsCount
                }
            };
        } catch (error) {
            console.error('Error counting service requests:', error);
            throw new Error('Error counting service requests: ' + error.message);
        }
    }


    async searchByTagsAndName(groupId, search) {
        try {
            const searchFilter = {
                groupId: groupId
            };

            if (search) {
                const numericSearch = parseInt(search);
                if (!isNaN(numericSearch)) {
                    searchFilter.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { title: { $regex: search, $options: 'i' } },
                        { phoneNumber: numericSearch },
                        { servicerequestId: numericSearch },
                        { assignedTo: { $regex: search, $options: 'i' } }
                    ];
                } else {
                    searchFilter.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { title: { $regex: search, $options: 'i' } },
                        { assignedTo: { $regex: search, $options: 'i' } }
                    ];
                }
            }

            const services = await ServicerequestModel.find(searchFilter);

            const response = {
                status: "Success",
                data: {
                    items: services,
                    totalItemsCount: services.length
                }
            };

            return response;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async updateServiceRequest(groupId, servicerequestId, data) {
        try {
            const resp = await ServicerequestModel.findOneAndUpdate(
                { groupId: groupId, servicerequestId: servicerequestId },
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

    async getExistingServiceRequests(userId, subcategoryId, categoryId, status) {
        try {
            const existingRequests = await ServicerequestModel.find({
                userId: userId,
                subcategoryId: subcategoryId,
                categoryId: categoryId,
                status: status
            });

            return existingRequests;
        } catch (error) {
            throw new Error('Error getting existing service requests: ' + error.message);
        }
    }

}

module.exports = new ServicerequestService(
    ServicerequestModel,
    "servicerequest"
);
