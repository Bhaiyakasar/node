const TrendModel = require("../schema/trend.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class TrendService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
}

module.exports = new TrendService(TrendModel, 'trend');
