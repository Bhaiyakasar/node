const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/order.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const TokenService = require("../services/token.service");

router.post("/", checkSchema(require("../dto/order.dto")), async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    try {
        // const { userId } = decodeToken(req.headers.authorization);
        const orderData = {
            ...req.body,
            // createdBy: userId,
            // updatedBy: userId,
            orderId: Date.now(),
            challanNo: Date.now(),
            orderDate: new Date().toISOString(),
        };
        const result = await service.createOrderAndDecrementInventory(req, orderData);
        requestResponsehelper.sendResponse(res, result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: "Field", message: error.message });
    }
});

router.post('/orderCount', async (req, res) => {
    const { groupId, start_date, end_date } = req.body;
    try {
        const order = await service.orderCount(groupId, start_date, end_date);
        res.status(200).json({ massage: "Orders featch sucsefully", order })
    } catch (error) {
        res.status(500).json({ status: "Field", message: error.message })
    }


})

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/updateByOrderId/:orderId", async (req, res) => {
    const serviceResponse = await service.updateOrder(
        req.params.orderId,
        req.body
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const { orderId, cartId, shippingId, userId, limit, page } = req.query;
        const criteria = {
            orderId, cartId, shippingId, userId,
            pageSize: parseInt(limit) || 10,
            pageNumber: parseInt(page) || 1
        };

        const serviceResponse = await service.getAllDataByGroupId(groupId, criteria);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        requestResponsehelper.sendResponse(res, error);
    }
});

router.get("/order/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const filters = req.query;

        const serviceResponse = await service.getAllOrder({ ...filters, groupId });

        if (!serviceResponse.data || serviceResponse.data.length === 0) {
            return res.status(404).json({ message: "Data not found", data: serviceResponse.data });
        }

        return res.status(200).json({
            message: "Success",
            data: serviceResponse.data,
            totalItemsCount: serviceResponse.totalItemsCount,
            totalPages: serviceResponse.totalPages
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, data: [] });
    }
});

router.post("/count", async (req, res) => {
    try {
        const { groupId } = req.body;

        const serviceResponse = await service.countInprogressServiceRequestByGroup(groupId);
        console.log(serviceResponse);

        if (!serviceResponse || Object.keys(serviceResponse.data.items).length === 0) {
            return res.status(404).json({ message: "No order found for the given GroupId." });
        }

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        requestResponsehelper.sendResponse(res, 500, error.message);
    }
});

router.get("/getByOrderId/:orderId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByorderId(req.params.orderId);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getBycustId/:custId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByCustId(req.params.custId);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/order", async (req, res) => {
    console.log('get request all orders', req.socket.remoteAddress);
    console.log('ipp is', req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null)
    console.log(req.ip);
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:groupId/:orderId", TokenService.checkPermission(["COR3", "MOR3"]), async (req, res) => {
    try {
        const { groupId, orderId } = req.params;

        const token = req.headers.authorization;
        const decodedToken = await TokenService.decodeToken(token);
        const userId = decodedToken.userId;

        const orderExists = await service.doesOrderExist(groupId, orderId);
        if (!orderExists) {
            return res.status(400).json({ status: 'Error', message: 'Order does not exist for the given orderId' });
        }

        const orderUpdateResponse = await service.updateOrderByOrderId(groupId, orderId, userId, req.body, req);
        if (orderUpdateResponse.isError) {
            return requestResponsehelper.sendResponse(res, orderUpdateResponse);
        }

        const response = {
            status: "Success",
            message: "Order Service Request updated successfully",
            data: orderUpdateResponse.data
        };

        requestResponsehelper.sendResponse(res, response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
});

router.delete("/delete/orders", TokenService.checkPermission(["COR4", "MOR4"]), async (req, res) => {
    const { groupId, orderIds } = req.body;
    try {
        const token = req.headers.authorization;
        const decodedToken = await TokenService.decodeToken(token);
        const userId = decodedToken.userId;

        const orderData = await service.deleteDataById(groupId, orderIds, userId, req);
        if (!orderData) {
            return res.status(404).json({ message: "Data not found" });
        }
        res.status(200).json({ message: "Data deleted successfully", data: orderData })
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting data" });
    }
});

module.exports = router;