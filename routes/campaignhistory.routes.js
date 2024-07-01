const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/campaignhistory.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const TokenService = require('../services/token.service');

router.post(
    "/",
    checkSchema(require("../dto/campaignhistory.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
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

router.get('/group/:groupId/campaign/:campaignId/lead/:leadId', async (req, res) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }

    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    const { groupId, campaignId, leadId } = req.params;

    const serviceResponse = await service.getDataBycampaignAndlead(
        groupId,
        campaignId,
        leadId,
        page,
        size,

    );

    const data = serviceResponse.data;

    res.status(200).json({
        message: "Data fetched successfully",
        data,
        totalItemsCount: serviceResponse.totalItemsCount,
        page,
        size,
    });
});

router.put('/campaignhistory/:groupId/:campaignhistoryId', async (req, res) => {
    const { groupId, campaignhistoryId } = req.params;

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized - Token is Not Found' });
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = await TokenService.decodeToken(token);
        const updatedBy = decodedToken.userId;

        const updateCampaign = await service.updateCampaignhistory(groupId, campaignhistoryId, req.body);

        if (!updateCampaign) {
            return res.status(404).json({ error: 'Campaign history not found' });
        }

        res.status(200).json({ message: 'Campaign history updated successfully', updateCampaign });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/group/:groupId', async (req, res) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 30;
    const { groupId } = req.params;
    const { leadId } = req.query;
    try {
        const serviceResponse = await service.getDataByCampaign(
            groupId,
            leadId,
            page,
            size
        );
        res.status(200).json({
            message: "Data fetched successfully",
            data: serviceResponse.data,
            totalItemsCount: serviceResponse.totalItemsCount,
            page,
            size,
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/all/campaignhistory", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get('/leads/export-to-excel', async (req, res) => {
    try {
        const { groupId, campaignId, callDate, assignedTo } = req.query;

        const filePath = await service.exportLeadsToExcel(groupId, campaignId, callDate, assignedTo);
        requestResponsehelper.sendResponse(res, filePath);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(error.message);
    }
});

module.exports = router;
