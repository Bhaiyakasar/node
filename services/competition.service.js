const CompetitionModel = require("../schema/competition.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class CompetitionService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        if (criteria.name) query.name = new RegExp(criteria.name, "i");

        if (criteria.competitionId) query.competitionId = criteria.competitionId;
        if(criteria.eventId)query.eventId=criteria.eventId;

        return this.preparePaginationAndReturnData(query, criteria);
    }
}

module.exports = new CompetitionService(CompetitionModel, "competition");
