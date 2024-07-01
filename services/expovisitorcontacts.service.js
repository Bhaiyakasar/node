const ExpoVisitorModel = require("../schema/expovisitor.schema");
const CustomerModel = require("../schema/customer.schema");
const ExpoVisitorContactsModel = require("../schema/expovisitorcontacts.schema");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const BaseService = require("@baapcompany/core-api/services/base.service");

class ExpoVisitorContactsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async create(data) {
        try {
            const existingRecord = await ExpoVisitorContactsModel.findOne({
                groupId: data.groupId,
                visitorUserId: data.visitorUserId,
                shopkeeperUserId: data.shopkeeperUserId
            });

            if (existingRecord) {
                return new ServiceResponse({
                    isError: true,
                    message: 'ExpoVisitorContact with the given visitorUserId and shopkeeperUserId already exists.',
                });
            }

            const expoVisitorContactId = +Date.now();
            data.expoVisitorContactId = expoVisitorContactId;

            const createdRecord = await super.create(data);

            return new ServiceResponse({
                data: createdRecord,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    async getAllByCriteria(criteria) {
        const { groupId, visitorUserId, shopkeeperUserId, limit, page } = criteria;

        const query = {
            groupId: groupId,
        };

        if (visitorUserId) {
            query.visitorUserId = visitorUserId;
        }

        if (shopkeeperUserId) {
            query.shopkeeperUserId = shopkeeperUserId;
        }

        const totalCount = await ExpoVisitorContactsModel.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const ExpoVisitorContacts = await ExpoVisitorContactsModel.find(query)
            .sort({ createdAt: -1 })
            .skip(limit * (page - 1))
            .limit(limit)
            .lean();

        const items = await Promise.all(ExpoVisitorContacts.map(async (contact) => {
            try {
                const [visitorData, shopkeeperData] = await Promise.all([
                    CustomerModel.findOne({ groupId, userId: contact.visitorUserId }),
                    CustomerModel.findOne({ groupId, userId: contact.shopkeeperUserId })
                ]);

                const visitorUserData = visitorData ? {
                    name: visitorData.name,
                    groupId: visitorData.groupId,
                    expoVisitorId: visitorData.expoVisitorId,
                    imageUrl: visitorData.imageUrl,
                    visitorUserId: visitorData.userId,
                    phoneNumber: visitorData.phoneNumber,
                    userId: visitorData.userId,
                    pinCode: visitorData.pinCode,
                    village: visitorData.location
                } : visitorUserId;

                const shopkeeperUserData = shopkeeperData ? {
                    name: shopkeeperData.name,
                    groupId: shopkeeperData.groupId,
                    custId: shopkeeperData.custId,
                    imageUrl: shopkeeperData.imageUrl,
                    shopkeeperUserId: shopkeeperData.userId,
                    phoneNumber: shopkeeperData.phoneNumber,
                    userId: shopkeeperData.userId,
                    pinCode: shopkeeperData.pinCode,
                    village: shopkeeperData.location
                } : shopkeeperUserId;

                return {
                    _id: contact._id,
                    groupId: contact.groupId,
                    expoVisitorContactId: contact.expoVisitorContactId,
                    visitorUserId: visitorUserData,
                    shopkeeperUserId: shopkeeperUserData,
                    createdAt: contact.createdAt,
                    updatedAt: contact.updatedAt,
                    __v: contact.__v
                };
            } catch (error) {
                console.error(`Error while populating data for contact with id ${contact._id}: ${error.message}`);
                return null;
            }
        }));

        const filteredItems = items.filter(item => item !== null);
        const response = {
            status: "Success",
            data: {
                items: filteredItems,
                totalItemsCount: totalCount,
                totalPages: totalPages
            }
        };

        return response;
    }

    async deleteExpovisitoreContactsById(groupId, expoVisitorContactId) {
        const expoVisitorContacts = await ExpoVisitorContactsModel.findOneAndDelete({ groupId: groupId, expoVisitorContactId: expoVisitorContactId });

        if (!expoVisitorContacts) {
            return {
                status: "Error",
                message: "Expo visitor contact already deleted",
                data: {},
            };
        }

        return {
            status: "Success",
            message: "Expo visitor contact deleted successfully",
            data: expoVisitorContacts,
        };
    }


}

module.exports = new ExpoVisitorContactsService(ExpoVisitorContactsModel, 'expovisitorcontacts');
