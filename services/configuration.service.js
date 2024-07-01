const ConfigurationModel = require("../schema/configuration.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class ConfigurationService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getConfiguration(groupId, configurationId, appId, page, pageSize) {
        let query = {
            groupId: groupId,
            type: { $nin: ["backend"] }
        };

        if (configurationId) {
            query.configurationId = configurationId;
        }

        if (appId) {
            query.appId = appId;
        }

        const totalItems = await ConfigurationModel.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const configuration = await ConfigurationModel.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        return {
            data: {
                message: "Data fetched successfully",
                items: configuration,
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems
            }
        };
    }

    async updateConfiguration(groupId, configurationId, data) {
        try {
            let configuration = await ConfigurationModel.findOneAndUpdate(
                { groupId: Number(groupId), configurationId: Number(configurationId) },
                { $set: data },
                { new: true }
            );
            return {
                data: {
                    items: configuration
                }
            };
        } catch (error) {
            throw new Error('Error updating configuration: ' + error.message);
        }
    }

    async deleteConfigurationById(groupId, configurationIds) {
        try {
            const configuration = await ConfigurationModel.deleteMany(
                { groupId: groupId, configurationId: { $in: configurationIds } },
            );
            return configuration;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new ConfigurationService(ConfigurationModel, "configuration");
