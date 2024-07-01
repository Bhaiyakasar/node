const CompetitionParticipantsModel = require("../schema/competitionparticipants.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class CompetitionParticipantsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        if (criteria.participant_name) query.participant_name = new RegExp(criteria.participant_name, "i");

        if (criteria.mobile_number) query.mobile_number = new RegExp(criteria.mobile_number);

        return this.preparePaginationAndReturnData(query, criteria);
    }
}

module.exports = new CompetitionParticipantsService(CompetitionParticipantsModel, 'competitionparticipants');
