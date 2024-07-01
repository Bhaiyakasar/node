const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/inventry.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post("/", checkSchema(require("../dto/inventry.dto")), async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }

    try {
        const { groupId, wareHouseId, productcode } = req.body;

        const warehouseName = await service.getWarehouseName(groupId, wareHouseId);

        const inventoryData = {
            buyingPrice: req.body.buyingPrice,
            memberPrice: req.body.memberPrice,
            regularPrice: req.body.regularPrice,
            marketPrice: req.body.marketPrice,
            gst: req.body.gst,
            igst: req.body.igst,
            sgst: req.body.sgst,
            cgst: req.body.cgst

        };

        const updateResult = await service.updateProducts(groupId, productcode, inventoryData);

        if (updateResult) {
            const inventryId = +Date.now();
            req.body.inventryId = inventryId;
            req.body.warehouse = { wareHouseId: wareHouseId, name: warehouseName };
            delete req.body.wareHouseId;

            const serviceResponse = await service.create(req.body);
            requestResponsehelper.sendResponse(res, serviceResponse);
        } else {
            throw new Error("Product update failed");
        }
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).send("Internal Server Error");
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

router.get("/all/inventry", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});



router.get("/all/getByGroupId/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId
        const { search, wareHouseId, productId } = req.query;

        const result = await service.getAllProductsByInventry(groupId, search, wareHouseId, productId);

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
