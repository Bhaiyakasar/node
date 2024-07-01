const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/servicerequest.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const TokenService = require("../services/token.service");

router.post("/", checkSchema(require("../dto/servicerequest.dto")), async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    try {
        const servicerequestId = +Date.now();
        req.body.servicerequestId = servicerequestId;

        const DateTime = new Date();
        const formattedDateTime = DateTime.toISOString();
        req.body.DateTime = formattedDateTime;

        const serviceResponse = await service.create(req.body);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error("Error:", error);
        requestResponsehelper.sendResponse(res, 500, error.message);
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

router.get("/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { name, phoneNumber, userId, assignedTo, servicerequestId, year, month, categoryId, status, search, page, limit, handledById } = req.query;

        const pageSize = parseInt(limit) || 10;
        const pageNumber = parseInt(page) || 1;

        const serviceResponse = await service.getAllData(name, phoneNumber, userId, assignedTo, groupId, servicerequestId, year, month, categoryId, status, search, pageNumber, pageSize, handledById);

        if (!serviceResponse.data || serviceResponse.data.length === 0) {
            return res.status(404).json({ message: "Data not found", data: serviceResponse.data });
        }

        return res.status(200).json({ message: "Success", data: serviceResponse.data, totalItemsCount: serviceResponse.totalItemsCount, totalPages: serviceResponse.totalPages });
    } catch (error) {
        return res.status(500).json({ message: error.message, data: [] });
    }
});

router.get("/order/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { name, phoneNumber, userId, servicerequestId, year, month, categoryId, orderId, status, search, page, limit } = req.query;

        const pageSize = parseInt(limit) || 10;
        const pageNumber = parseInt(page) || 1;

        const serviceResponse = await service.getAllOrder(name, phoneNumber, userId, groupId, servicerequestId, year, month, categoryId, orderId, status, search, pageNumber, pageSize);

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

router.delete("/groupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const servicerequestIds = req.query.servicerequestId;

    if (!servicerequestIds) {
        return res.status(400).json({ message: "servicerequestIds parameter is missing" });
    }

    const servicerequestId = servicerequestIds.split(',');

    if (servicerequestId.length === 0) {
        return res.status(400).json({ message: "servicerequestIds parameter is empty" });
    }

    try {
        let deletedServicerequestData = await service.deleteDataById(groupId, servicerequestId);
        res.status(200).json({
            message: "Data delete successfully",
            data: deletedServicerequestData,
        });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting data" });
    }
});

router.post("/count", async (req, res) => {
    try {
        const { groupId, userId, startDate, endDate } = req.body;

        const serviceResponse = await service.countServiceRequestByGroupAndDate(groupId, userId, startDate, endDate);

        // if (!serviceResponse || serviceResponse.data.totalItemsCount === 0) {
        //     return res.status(404).json({ message: "No service requests found within the specified date range for the given GroupId." });
        // }

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        requestResponsehelper.sendResponse(res, 500, error.message);
    }
});

router.get("/search/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const search = req.query.search;

        const serviceResponse = await service.searchByTagsAndName(groupId, search);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.put("/group/:groupId/:servicerequestId", async (req, res) => {
    const serviceResponse = await service.updateServiceRequest(req.params.groupId, req.params.servicerequestId, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get('/user/:userId/subcategoryId/:subcategoryId/categoryId/:categoryId', async (req, res) => {
    try {
        const existingServiceRequests = await service.getExistingServiceRequests(req.params.userId, req.params.subcategoryId, req.params.categoryId, "new");

        if (existingServiceRequests.length >= 1) {
            return res.status(400).json({
                message: "तुम्ही आधीच या सेवेसाठी एकदा विनंती केली आहे, आमची टीम तुम्हाला शक्य तितक्या लवकर कॉल करेल.",
                data: {},
            });
        }

        return requestResponsehelper.sendResponse(res, existingServiceRequests);
    } catch (error) {
        return res.status(500).json({
            message: "Some error occurred while processing your request. Please try again later.",
            data: {},
        });
    }
});

module.exports = router;
