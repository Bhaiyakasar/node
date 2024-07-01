const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/survey.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/survey.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const sId =+Date.now();
        req.body.sId=sId;
        
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

router.get("/all/survey", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getAllByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
       
        sId:req.query.sId,
        startDate:req.query.startDate,
        endDate:req.query.endDate,
        createdBy:req.query.createdBy,
        updatedBy:req.query.updatedBy,
        updatedDate:req.query.updatedDate,
        type:req.query.type,
        accessLevel:req.query.accessLevel,
        link:req.query.link,
        attempted:req.query.attempted,
        tags:req.query.tags,
    };
    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
  });
  

module.exports = router;
