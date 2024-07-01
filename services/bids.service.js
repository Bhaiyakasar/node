const BidsModel = require("../schema/bids.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class BidsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getBidsByPostId(criteria) {
        const query = {};
        if (criteria.postId) {
            query.postId = criteria.postId;
        }
        return this.getAllByCriteria(query);
    }

    
}

module.exports = new BidsService(BidsModel, 'bids');
