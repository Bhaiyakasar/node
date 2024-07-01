const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/cart.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const CartModel = require("../schema/cart.schema");

router.post(
    "/",
    checkSchema(require("../dto/cart.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const cartId = +Date.now();
        req.body.cartId = cartId;
        const serviceResponse = await service.saveProductInCart(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.delete('/:groupId/:cartId/:productCode', async (req, res) => {
    const { groupId, cartId, productCode } = req.params;

    const serviceResponse = await service.deleteProductByGroupIdUserIdCartId(groupId, cartId, productCode);

    if (serviceResponse.status === 200) {
        res.status(200).json({ message: serviceResponse.message });
    } else if (serviceResponse.status === 404) {
        res.status(404).json({ message: serviceResponse.message });
    } else {
        res.status(500).json({ message: serviceResponse.message });
    }
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getCartDetailsByCartId/:cartId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }

    const committeeId = req.params.cartId;
    const name = req.query.name; // Get the name from the query parameter

    const serviceResponse = await service.getAllProductsByCartId(
        committeeId,
        name
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getProductByUserId/:groupId/:userId", async (req, res, next) => {
    const { groupId, userId } = req.params;

    try {
        const response = await service.getCartDetailsByGroupIdAndUserId(groupId, userId);

        if (response === null) {
            return res.status(404).json({ status: 'Error', message: 'Cart not found' });
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: error.message });
    }
});

router.get("/product/:productId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getProductById(
        req.params.productId,
        req.query
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const serviceResponse = await service.getAllDataByGroupId(
        req.params.groupId,
        req.query
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        name: req.query.name,
        code: req.query.code,
        userId: req.query.userId,
    };

    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:groupId/:userId/:productcode", async (req, res) => {
    const { groupId, userId, productcode } = req.params;
    const { quantity,amount } = req.body;

    try {
        const serviceResponse = await service.updateProductQuantity(groupId, userId, productcode, quantity,amount);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
});

module.exports = router;
