const ServiceActionModel = require("../schema/serviceaction.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class ServiceActionService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
}

module.exports = new ServiceActionService(ServiceActionModel, 'serviceaction');
