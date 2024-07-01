const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/productsquotation.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post("/", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }

    try {
        const serviceResponse = await service.createIfNotExists(req.body);

        if (!serviceResponse.success) {
            return res.status(400).json({ message: serviceResponse.message });
        }

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            message: "An error occurred while processing your request.",
            error: error.message
        });
    }
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

router.get("/all/productsQuotation", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId/intent/:intentId", async (req, res) => {
    try {
        const { groupId, intentId } = req.params;

        const serviceResponse = await service.getByGroupIdAndIntent(groupId, intentId);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/group/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const { quotationId, page, limit } = req.query;

        const serviceResponse = await service.getByGroupIdAndQuotationId(groupId, quotationId, page, limit);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put("/groupId/:groupId/quotationId/:quotationId", async (req, res) => {
    try {
        const { groupId, quotationId } = req.params
        const data = req.body

        let quotation = await service.updateQuotation(groupId, quotationId, data)
        res.json(quotation)
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
})

module.exports = router;
