const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/deliverycode.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/deliverycode.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }

        // Check if the delivery code already exists
        const existingCode = await service.findByCode(req.body.code);
        if (existingCode) {
            return res
                .status(400)
                .json({ message: "This code already exists." });
        }

        // If the code doesn't exist, proceed with creating a new delivery code
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
router.put("/updateByDeliveryCode/:deliveryCodeId", async (req, res) => {
    const serviceResponse = await service.updateCustomer(
        req.params.deliveryCodeId,
        req.body
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/getByDeliveryCodeId/:deliveryCodeId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByDeliveryCodeId(
        req.params.deliveryCodeId
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        code: req.query.code,
    };

    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/all/deliveryCode", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

module.exports = router;
