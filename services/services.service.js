const { default: mongoose } = require("mongoose");
const CategoryModel = require("../schema/category.schema");
const ServiceModel = require("../schema/services.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class ServicesService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getAllDataByGroupId(groupId, lat, lon, distance, categoryId, subcategoryId, parentServiceId) {
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

            if (subcategoryId) {
                query.subcategoryId = subcategoryId;
            }

            if (parentServiceId) {
                query.parentServiceId = parentServiceId;
            } else {
                query.parentServiceId = null;
            }

            if (categoryId) {
                query.categoryId = categoryId;
            }

            const menuItemData = await ServiceModel.find(query).sort({ featured: -1, promotion: -1, sponsored: -1 });

            if (!menuItemData) {
                return null;
            }

            const response = {
                status: "Success",
                data: {
                    items: menuItemData,
                    totalItemsCount: menuItemData.length
                }
            };

            return response;
        } catch (error) {
            throw error;
        }
    }

    async getByGroupId(groupId, subcategoryId) {
        return this.execute(async () => {
            const query = {
                groupId: groupId,
                subcategoryId: subcategoryId
            };
            return await this.getAllByCriteria(query);
        });
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

            const services = await ServiceModel.find(searchFilter);

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

}

module.exports = new ServicesService(ServiceModel, "services");
