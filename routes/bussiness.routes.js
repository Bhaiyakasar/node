const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/bussiness.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/bussiness.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const bussinesId = +Date.now();
        req.body.bussinesId = bussinesId;
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

router.get("/all/bussiness", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const distance = req.query.distance;
    const name = req.query.name;
    const categoryId = req.query.categoryId;
    const subGroupId = req.query.subGroupId;
    const businessId = req.query.businessId;
    const tags = req.query.tags;

    const serviceResponse = await service.getAllDataByGroupId(groupId, lat, lon, distance, name, categoryId, subGroupId, businessId, tags);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/search/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        const distance = req.query.distance;
        const search = req.query.search;

        const serviceResponse = await service.searchByTagsAndName(groupId, lat, lon, distance, search);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;
