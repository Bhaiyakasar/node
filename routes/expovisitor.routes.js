const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/expovisitor.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/expovisitor.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const existingMember = await service.findByPhoneNumber({
            phoneNumber: req.body.phoneNumber, groupId: req.body.groupId
        });

        if (existingMember) {
            return requestResponsehelper.sendResponse(res, {
                message: "expovisitor with the same phoneNumber already exists",
                data: existingMember,
            });
        }
        const expoVisitorId = +Date.now();

        req.body.expoVisitorId = expoVisitorId;
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

router.get("/getByExpoVisitorId/:groupId/:expoVisitorId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByexpoVisitorId(req.params.groupId, req.params.expoVisitorId);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        name: req.query.name,
        phoneNumber: req.query.phoneNumber,
        userId: req.query.userId,
        appId: req.query.appId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/expoVisitor", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/exists/:groupId/:userId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }

    const { groupId, userId } = req.params;
    const expoVisitorExists = await service.checkExpoVisitorExists(groupId, userId);

    requestResponsehelper.sendResponse(res, {
        data: { expoVisitorExists },
    });
});

router.put("/:groupId/user/:userId", async (req, res) => {
    const serviceResponse = await service.updateExpoVisitorByUserId(req.params.groupId, req.params.userId, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.post("/count", async (req, res) => {
    try {
        const { groupId, start_date, end_date } = req.body;

        const leadCounts = await service.countLeadsByGroupAndDate(groupId, start_date, end_date);

        if (!leadCounts || Object.keys(leadCounts.data.items).length === 0) {
            return res.status(404).json({ message: "No leads found within the specified date range for the given GroupId." });
        }
        res.json(leadCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
