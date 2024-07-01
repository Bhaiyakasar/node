const surveyQuestionAnswerModel = require("../schema/surveyQuestionAnswer.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class surveyQuestionAnswerService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }


    
    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };
        if (criteria.sId) query.sId = criteria.sId;
        if (criteria.answer) query.answer = criteria.answer;
        if (criteria.questionId) query.questionId = criteria.questionId;
        return this.preparePaginationAndReturnData(query, criteria);
    }
}    
module.exports = new surveyQuestionAnswerService(surveyQuestionAnswerModel, 'surveyQuestionAnswer');



