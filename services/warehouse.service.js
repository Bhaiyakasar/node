const WarehouseModel = require("../schema/warehouse.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class WarehouseService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        if (criteria.name) query.name = new RegExp(criteria.name, "i");

        if (criteria.productId)
            query.productId = new RegExp(criteria.productId, "i");

        return this.preparePaginationAndReturnData(query, criteria);
    }
}

module.exports = new WarehouseService(WarehouseModel, "warehouse");
