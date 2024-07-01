const SurveyModel = require("../schema/survey.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class SurveyService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };
       
        if (criteria.sId)query.sId=criteria.sId;
        if (criteria.startDate)query.startDate=criteria.startDate;
        if (criteria.endDate)query.endDate=criteria.endDate;
        if (criteria.createdBy)query.createdBy=criteria.createdBy;
        if (criteria.updatedBy)query.updatedBy=criteria.updatedBy;
        if (criteria.updatedDate)query.updatedDate=criteria.updatedDate;
        if (criteria.type)query.type=criteria.type;
        if (criteria.accessLevel)query.accessLevel=criteria.accessLevel;
        if (criteria.link)query.link=criteria.link;
        if (criteria.attempted)query.attempted=criteria.attempted;
        if (criteria.tags)query.tags=criteria.tags;
        return this.preparePaginationAndReturnData(query, criteria);
    }
}

module.exports = new SurveyService(SurveyModel, 'survey');
