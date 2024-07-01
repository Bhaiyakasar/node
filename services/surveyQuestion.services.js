const surveyQuestionModel = require("../schema/surveyQuestion.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class Service extends BaseService {
  constructor(dbModel, entityName) {
    super(dbModel, entityName);
  }
  async createQuestion(questionData) {
    const maxIndexQuestion = await this.model.findOne({}, {}, { sort: { index: -1 } });
    const maxQuestionId = await this.model.findOne({}, {}, { sort: { questionId: -1 } });
    let newIndex = 1;
    let newQuestionId = 1;
    if (maxIndexQuestion) {
      newIndex = maxIndexQuestion.index + 1;
    }
    if (maxQuestionId) {
      newQuestionId = maxQuestionId.questionId + 1;
    }
    questionData.index = newIndex;
    questionData.questionId = newQuestionId;
    const newQuestion = await this.create(questionData);
    return newQuestion;
  }

  getAllDataByGroupId(groupId, criteria) {
    const query = {
      groupId: groupId,
    };;
    if (criteria.questionId) query.questionId = criteria.questionId;
    return this.preparePaginationAndReturnData(query, criteria);
  }

  async getNextQuestion(groupId, index) {
    try {
      const nextQuestion = await this.model.findOne({ groupId: groupId, index: index + 1 });
      return nextQuestion || null;
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching next question");
    }
  }

  async deleteSurveyQuestionById(questionId, groupId) {
    try {
      return await surveyQuestionModel.deleteOne(questionId, groupId);
    } catch (error) {
      throw error;
    }
  }

  async updateSurveyQuestionById(questionId, groupId, newData) {
    try {
      const updateHostelPaymnet = await surveyQuestionModel.findOneAndUpdate(
        { questionId: questionId, groupId: groupId },
        newData,
        { new: true }
      );
      return updateHostelPaymnet;
    } catch (error) {
      throw error;
    }
  }
}
module.exports = new Service(surveyQuestionModel, "surveyQuestion");