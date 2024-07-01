const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/paymenthistory.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post("/", checkSchema(require("../dto/paymenthistory.dto")), async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
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

router.get("/all/paymenthistory", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/payment-history/:groupId/:orderId", async (req, res) => {
    try {
        const { groupId, orderId } = req.params;

        const paymentHistory = await service.getPaymentHistory(groupId, orderId);

        res.status(200).json({ status: 'Success', massage: 'Order Payment history featch successfully', data: paymentHistory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
});


module.exports = router;