const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/campaign.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const TokenService = require('../services/token.service');
const xlsx = require('xlsx');

router.post('/createcampaign', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized - Token is Not Found' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = await TokenService.decodeToken(token);
        const loggedUserId = decodedToken.userId;

        const { name, groupId, userId, managerId, start_date, end_date, status, description, type, assignedTo, leadId: leadIds, templateId: templateIds } = req.body;

        const campaignId = +Date.now();
        const totalLead = leadIds.length;

        const result = await service.createCampaign(loggedUserId, name, groupId, userId, managerId, campaignId, start_date, end_date, status, description, type, assignedTo, leadIds, totalLead, templateIds);
        res.status(201).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
router.put('/update-leads/:groupId/:campaignId/:leadId', async (req, res) => {
    const { groupId, campaignId, leadId } = req.params;
    const updatedLeadData = req.body;

    const result = await service.updateCampaignLeads(groupId, campaignId, leadId, updatedLeadData);

    if (result) {
        res.status(200).json({ success: true, message: "Campaign leads updated successfully", data: result });
    } else {
        res.status(500).json({ success: false, message: "Failed to update campaign leads" });
    }
});

router.delete('/delete/campaignLead/:groupId/:campaignId/:leadId', async (req, res) => {
    const { groupId, campaignId, leadId } = req.params;

    try {
        const result = await service.deleteCampaignLead(groupId, campaignId, leadId);

        if (result.success) {
            res.status(200).json({ success: true, message: "Lead deleted from campaign successfully" });
        } else {
            res.status(404).json({ success: false, message: "Lead not found or unable to delete lead", error: result.error });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

router.get("/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const filters = {
            name: req.query.name,
            handledBy: req.query.handledBy,
            assignedTo: req.query.assignedTo,
            status: req.query.status,
            type: req.query.type,
            search: req.query.search,

        }
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit);
        const campaignData = await service.getCampaignData(groupId, filters, page, limit);

        res.status(200).json(campaignData);
    } catch (error) {
        console.error('Error:', error);
        if (error.message === "Provide either userId or managerId") {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
});

router.put('/update/campaign/:groupId/:campaignId', async (req, res) => {
    const { groupId, campaignId } = req.params;

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized - Token is Not Found' });
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = await TokenService.decodeToken(token);
        const updatedBy = decodedToken.userId;

        const updateCampaign = await service.updateCampaignStatus(groupId, campaignId, req.body, updatedBy);

        if (!updateCampaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.status(200).json({ message: 'Campaign status updated successfully', updateCampaign });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete/campaign/:groupId', async (req, res) => {
    const groupId = req.params.groupId;
    const campaignIds = req.query.campaignIds;

    if (!campaignIds) {
        return res.status(400).json({ message: 'Please provide campaignIds to delete' });
    }

    const campaignIdArray = campaignIds.split(',');

    try {
        const result = await service.deleteDataByGroupIdAndCampaignId(groupId, campaignIdArray);
        res.json({ message: 'Data deleted successfully', result: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/count", async (req, res) => {
    try {
        const { groupId, start_date, end_date, handledBy, userId, name, assignedTo, status, type, search } = req.body;

        const countResult = await service.countGroupAndDate(groupId, start_date, end_date, handledBy, userId, name, assignedTo, status, type, search);

        res.json(countResult);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/campaign", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/campignleads/:groupId/:campaignId", async (req, res) => {
    try {
        const { groupId, campaignId } = req.params;
        const filters = {
            status: req.query.status,
            source: req.query.source,
            assignedTo: req.query.assignedTo,
            handledBy: req.query.handledBy,
            location: req.query.location,
            isHandled: req.query.isHandled,
            search: req.query.search,
            phoneNumber: req.query.phoneNumber
        };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit);
        const result = await service.getAllExecutionLeads(groupId, campaignId, filters, page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/:groupId/:campaignId/all-leads", async (req, res) => {
    try {
        const { groupId, campaignId } = req.params;
        const filters = {
            status: req.query.status,
            source: req.query.source,
            assignedTo: req.query.assignedTo,
            handledBy: req.query.handledBy,
            location: req.query.location,
            isHandled: req.query.isHandled,
            search: req.query.search,
            phoneNumber: req.query.phoneNumber
        };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit);  // No default value here
        const result = await service.getAllLeads(groupId, campaignId, filters, page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/leadcount", async (req, res) => {
    try {
        const { groupId, campaignId } = req.body;
        const leadCounts = await service.countLeadsByCampaignId(groupId, campaignId);
        res.json(leadCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/followUpLeads/:groupId/:campaignId', async (req, res) => {
    const { groupId, campaignId } = req.params;

    try {
        const followUpDate = await service.getFilteredLeads(groupId, campaignId);

        if (followUpDate.length > 0) {
            res.json({
                message: "Campaign data fetched successfully",
                followUpDate,
            });
        } else {
            res.json({ message: "No leads found for the given campaign and group" });
        }

    } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/campaign/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const filters = {
        name: req.query.name,
        status: req.query.status,
        source: req.query.source,
        type: req.query.type,
        assignedTo: req.query.assignedTo,
        handledBy: req.query.handledBy,
        location: req.query.location,
        search: req.query.search
    };
    const page = req.query.page;
    const limit = req.query.limit;
    try {
        const leads = await service.getAllLeadData(groupId, filters, page, limit);
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/opretor/campaign/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const filters = {
            handledBy: req.query.handledBy,
            assignedTo: req.query.assignedTo,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            search: req.query.search,
        }
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit);
        const campaignData = await service.getAssignedCampaign(groupId, filters, page, limit);

        res.status(200).json(campaignData);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/leads/:groupId/:campaignId', async (req, res) => {
    const { groupId, campaignId } = req.params;
    try {
        const leads = await service.getCampaignLeads(groupId, campaignId);
        res.json({ leads });
    } catch (error) {
        console.error('Error', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;