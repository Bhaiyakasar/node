const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/workflow.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/workflow.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const workflowId = +Date.now();
        req.body.workflowId = workflowId;
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

router.get("/all/workflow", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const { eventName } = req.query;

        if (!groupId || !eventName) {
            return res.status(400).json({ error: "Please provide both groupId in the URL and eventName in the query parameters." });
        }

        const serviceResponse = await service.getPhoneNumbersByGroupAndEvent(groupId, eventName);
        res.json(serviceResponse);
    } catch (error) {
        res.status(500).json({ error: error.message || "An error occurred while fetching workflow phone numbers." });
    }
});


module.exports = router;
