const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/bids.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/bids.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const { originalprice } = req.body;
        const commissionPercentage = 0.01;
        const commissionAmount = originalprice * commissionPercentage;
        const bidprice = originalprice - commissionAmount;
        const serviceResponse = await service.create({
            ...req.body,
            bidprice,
        });
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

router.get("/all/bids", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/bids/:postId", async (req, res) => {
    const serviceResponse = await service.getBidsByPostId({
        postId: req.params.postId,
    });
    requestResponsehelper.sendResponse(res, serviceResponse);
});

module.exports = router;
