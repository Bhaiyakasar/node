const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/shipping.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/shipping.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }

        // Generate the auto ID
        const shippingId = +Date.now();

        // Set the generated ID in the request body
        req.body.shippingId = shippingId;

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
router.put("/updateByShippingId/:shippingId", async (req, res) => {
    const serviceResponse = await service.updateShipping(
        req.params.shippingId,
        req.body
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/getByShippingId/:shippingId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByShippingId(
        req.params.shippingId
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        orderId: req.query.orderId,
    };

    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/all/shipping", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

module.exports = router;
