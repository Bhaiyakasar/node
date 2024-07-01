const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/serviceresponse.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/serviceresponse.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const DateTime = new Date();
        const formattedDateTime = DateTime.toISOString();
        req.body.DateTime = formattedDateTime;
        const serviceResponse = await service.createServiceResponse(req.body);
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


router.get("/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const servicerequestId = req.query.servicerequestId;

    try {
        const serviceResponse = await service.getAllByGroupIdAndRequestId(groupId, servicerequestId);
        const responseData = {
            status: "Success",
            data: {
                items: serviceResponse,
                totalItemsCount: serviceResponse.length
            }
        };
        requestResponsehelper.sendResponse(res, responseData);
    } catch (error) {
        console.error(error);
        requestResponsehelper.sendResponse(res, "An error occurred while processing the request.");
    }
});



module.exports = router;
