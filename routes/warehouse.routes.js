const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/warehouse.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/warehouse.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const wareHouseId = +Date.now()
        req.body.wareHouseId = wareHouseId
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

router.get("/all/warehouse", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        productId: req.query.productId,
        name: req.query.name,
    };

    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

module.exports = router;
