const BussinessModel = require("../schema/bussiness.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceModel = require("../schema/services.schema");

class BussinessService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getAllDataByGroupId(groupId, lat, lon, distance, name, categoryId, subGroupId, businessId, tags) {
        try {
            const query = {
                groupId: groupId,
            };

            if (lat && lon) {
                query.location = {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lat, lon]
                        },
                        $maxDistance: distance || 6371000     // 40 kilometers in meters
                    }
                };
            }

            if (name) query.name = new RegExp(name, "i");

            if (categoryId) query.categoryId = categoryId;

            if (subGroupId) query.subGroupId = subGroupId;

            if (businessId) query.businessId = businessId;

            if (tags) query.tags = new RegExp(tags, "i");

            const bussiness = await BussinessModel.find(query).sort({ featured: -1, promotion: -1, sponsored: -1 });

            const response = {
                status: "Success",
                data: {
                    items: bussiness,
                    totalItemsCount: bussiness.length
                }
            };

            return response;
        } catch (error) {
            throw error;
        }
    }

    async searchByTagsAndName(groupId, lat, lon, distance, search) {
        try {
            const searchFilter = {
                groupId: groupId
            };

            if (lat && lon) {
                searchFilter.location = {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lat, lon]
                        },
                        $maxDistance: distance || 6371000     // 40 kilometers in meters
                    }
                };
            }

            if (search) {
                searchFilter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { desc: { $regex: search, $options: 'i' } },
                    { tags: { $in: search.split(",") } }
                ];
            }

            const bussiness = await BussinessModel.find(searchFilter);

            const response = {
                status: "Success",
                data: {
                    items: bussiness,
                    totalItemsCount: bussiness.length
                }
            };

            return response;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }


}

module.exports = new BussinessService(BussinessModel, 'bussiness');
