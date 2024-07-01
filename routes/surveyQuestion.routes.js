const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/surveyQuestion.services");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
//create question sequential
let questionCounter = 1;
function generateQuestionId() {
  const sequentialPart = questionCounter++;
  return `${sequentialPart.toString().padStart(0, "0")}`;
}

//create index sequential
let indexCounter = 1;
function generateIndex() {
  const sequentialPart = indexCounter++;
  return `${sequentialPart.toString().padStart(0, "0")}`;
}
router.post(
  "/create",
  checkSchema(require("../dto/surveyQuestion.dto")),
  async (req, res, next) => {
    try {
      if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
      }
      const questionData = req.body;
      req.body.questionId = generateQuestionId();
      req.body.index = generateIndex();
      const createdQuestion = await service.createQuestion(questionData);
      requestResponsehelper.sendResponse(res, {
        data: createdQuestion,
        questionId: questionData.questionId

      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Failed", message: "Internal Server Error" });
    }
  }
);
router.get("/all/question", async (req, res) => {
  const serviceResponse = await service.getAllByCriteria({});

  requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getAllByGroupId/:groupId", async (req, res) => {
  const groupId = req.params.groupId;
  const criteria = {
    name: req.query.name,
    questionId: req.query.questionId
  };
  const serviceResponse = await service.getAllDataByGroupId(
    groupId,
    criteria
  );
  requestResponsehelper.sendResponse(res, serviceResponse);
});

let index = 0;
router.get("/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId; // Fix here
    const nextQuestion = await service.getNextQuestion(groupId, index);
    if (nextQuestion) {
      index++;
      res.json({
        status: "Success",
        data: nextQuestion,
        currentQuestionIndex: index
      });
      console.log(index)

    } else {
      res.json({
        message: "No more questions available.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
});

router.delete(
  "/groupId/:groupId/questionId/:questionId",
  async (req, res) => {
    try {
      const questionId = req.params.questionId;
      const groupId = req.params.groupId;
      const deleteSurveyQuestion =
        await service.deleteSurveyQuestionById({
          questionId: questionId,
          groupId: groupId,
        });
      if (!deleteSurveyQuestion) {
        res.status(404).json({
          error: "SurveyQuestion data not found to delete",
        });
      } else {
        res.status(201).json(deleteSurveyQuestion);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put(
  "/groupId/:groupId/questionId/:questionId",
  async (req, res) => {
    try {
      const questionId = req.params.questionId;
      const groupId = req.params.groupId;
      const newData = req.body;
      const updateSurveyQuestion =
        await service.updateSurveyQuestionById(
          questionId,
          groupId,
          newData
        );
      if (!updateSurveyQuestion) {
        res.status(404).json({
          error: "SurveyQuestion data not found to update",
        });
      } else {
        res.status(200).json(updateSurveyQuestion);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
module.exports = router;
