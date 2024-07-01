const ShippingModel = require("../schema/shipping.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
class ShippingService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        // if (criteria.name) query.name = new RegExp(criteria.name, "i");

        if (criteria.orderId) query.orderId = criteria.orderId;

        return this.preparePaginationAndReturnData(query, criteria);
    }
    async updateShipping(shippingId, data) {
        try {
            const resp = await ShippingModel.findOneAndUpdate(
                { shippingId: shippingId },

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
    async getByShippingId(shippingId) {
        return this.execute(() => {
            return this.model.findOne({ shippingId: shippingId });
        });
    }
}

module.exports = new ShippingService(ShippingModel, "shipping");
