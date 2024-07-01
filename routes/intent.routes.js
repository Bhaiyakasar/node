const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/intent.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post("/", checkSchema(require("../dto/intent.dto")), async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const intentId = +Date.now();
    req.body.intentId = intentId;
    const serviceResponse = await service.create(req.body);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

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

router.get("/all/intent", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { intentId, supplierId } = req.query
        const serviceResponse = await service.getByGroupId(groupId, intentId, supplierId);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.put("/group/:groupId/intent/:intentId", async (req, res) => {
    try {
        const { groupId, intentId } = req.params;
        const updatedData = req.body;

        const serviceResponse = await service.updateByGroupIdAndIntentId(groupId, intentId, updatedData);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
