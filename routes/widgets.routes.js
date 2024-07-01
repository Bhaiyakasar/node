const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/widgets.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/widgets.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const widgetId = +Date.now();
        req.body.widgetId = widgetId;
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

router.get("/all/widgets", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/app/:appId", async (req, res) => {
    try {
        const appId = req.params.appId;
        const { widgetId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;

        let widget = await service.getWidgets(widgetId, appId, page, pageSize);
        res.json(widget);
    } catch (error) {
        res.status(500).send({ error: "An error occurred" });
    }
});

router.delete("/delete/:widgetId", async (req, res) => {
    try {
        const { widgetId } = req.params;

        const result = await service.deleteUserWidget( widgetId);

        if (result.success) {
            res.json({ message: "Widget deleted successfully" });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).send({ error: "An error occurred" });
    }
});



module.exports = router;
