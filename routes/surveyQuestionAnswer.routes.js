const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/surveyQuestionAnswer.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");


router.post(
    "/",
    checkSchema(require("../dto/surveyQuestionAnswer.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const serviceResponse = await service.create(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});


router.get("/getAllByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        sId:req.query.sId,
        questionId:req.query.questionId,
        answer:req.query.answer
    };
    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
  });
  

router.get("/all/Answers", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    
    requestResponsehelper.sendResponse(res, serviceResponse);
});

module.exports = router;




