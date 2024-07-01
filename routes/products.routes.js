const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/products.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/products.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const productcode = +Date.now();
        req.body.productcode = productcode;
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

router.get("/all/products", async (req, res) => {
    const serviceResponse = await service.preparePaginationAndReturnData(
        {
        },
        req.query
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/find/get-top-selling-products/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const serviceResponse = await service.getAllSponsoredProductsByGroupId(
        groupId,
        req.query
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getByproductcode/:groupId/:productcode", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByProductCode(
        req.params.productcode,
        req.params.groupId
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/searchProductByPrice/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        name: req.query.name,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        slug: req.query.slug,
        productcode: req.query.productcode,
        categoryId: req.query.categoryId,
    };

    if (criteria.minPrice || criteria.maxPrice) {
        const serviceResponse = await service.processProductSearch(
            groupId,
            criteria
        );
        requestResponsehelper.sendResponse(res, serviceResponse);
    } else {
        const serviceResponse = await service.processProductSearch(
            groupId,
            criteria
        );
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
});

router.get("/all/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const { minPrice, maxPrice, name, productcode, categoryId, model, serialNumber, subcategoryId } = req.query;

    const criteria = {
        search: req.query.search
    };

    try {
        const serviceResponse = await service.getAllProductsByGroupId(groupId, minPrice, maxPrice, name, productcode, categoryId, model, serialNumber, subcategoryId, criteria);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        requestResponsehelper.sendResponse(res, "An error occurred while fetching products.");
    }
});


module.exports = router;
