const DeliveryCodeModel = require("../schema/deliverycode.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class DeliveryCodeService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        if (criteria.code) query.code = criteria.code;

        return this.preparePaginationAndReturnData(query, criteria);
    }
    async getByDeliveryCodeId(deliveryCodeId) {
        return this.execute(() => {
            return this.model.findOne({ deliveryCodeId: deliveryCodeId });
        });
    }
    async updateDeliveryCode(deliveryCodeId, data) {
        try {
            const resp = await DeliveryCodeModel.findOneAndUpdate(
                { deliveryCodeId: deliveryCodeId },

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
    async  findByCode(code) {
        try {
          // Assuming you have a delivery code model or database schema defined
          const existingCode = await DeliveryCodeModel.findOne({ code });
          return existingCode;
        } catch (error) {
          // Handle any errors that occur during the database query
          console.error("Error finding delivery code:", error);
          throw error;
        }
      }
}

module.exports = new DeliveryCodeService(DeliveryCodeModel, "deliverycode");
