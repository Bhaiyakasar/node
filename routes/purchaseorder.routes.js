const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/purchaseorder.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/purchaseorder.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }

        const serviceResponse = await service.createPurchaseOrder(req.body);
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

router.get("/all/purchaseOrder", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const { quotationId, page, pageSize } = req.query;

        const serviceResponse = await service.getQuotationByGroupId(groupId, quotationId, page, pageSize);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put("/group/:groupId/purchaseOrder/:purchaseOrderId", async (req, res) => {
    try {
        const { groupId, purchaseOrderId } = req.params;
        const updatedData = req.body;

        const serviceResponse = await service.updateByGroupIdAndPurchaseOrderId(groupId, purchaseOrderId, updatedData);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


module.exports = router;
