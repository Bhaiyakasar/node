const CampaignModel = require("../schema/campaign.schema");
const CampaignhistoryModel = require("../schema/campaignhistory.schema");
const LeadsModel = require("../schema/leads.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const TemplateModel = require("../schema/template.schema")
const OperatorsModel = require("../schema/operators.schema");
const WidgetsModel = require("../schema/widgets.schema");
const UserWidgetsModel = require("../schema/userwidgets.schema");
const mongoose = require('mongoose');
const status = require("../config/status");
const { log } = require("winston");
const Completed = status.COMPLITED;
const NewLeads = status.NEWLEADS;
const Positive = status.POSITIVELEADS;
const Negative = status.NEGATIVELEADS;
const Neutral = status.NEUTRALLEADS;
const Won = status.WONLEADS;
const Open = status.OPENLEADS;
const Lost = status.LOSTLEADS;
const Counselling = status.COUNSELLING;
const CounsellingDone = status.COUNSELLINGDONE;
const INPROGRESS = status.INPROGRESS;

class CampaignService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    
    async  createCampaign(loggedUserId, name, groupId, userId, managerId, campaignId, start_date, end_date, status, description, type, assignedTo, leadIds, totalLead, templateIds) {
        try {
            const operatorData = await OperatorsModel.findOne({ empId: assignedTo });
                const leadData = await LeadsModel.aggregate([
                { $match: { groupId: groupId, leadId: { $in: leadIds } } },
                { $addFields: { assignedTo: parseInt(assignedTo) } }
            ]);
                leadData.forEach((lead, index) => {
                lead.index = index + 1; 
            });
                const templateData = await TemplateModel.find({ templateId: { $in: templateIds } });
                await LeadsModel.updateMany(
                { groupId: groupId, leadId: { $in: leadIds } },
                { $set: { assignedTo: parseInt(assignedTo) } }
            );
    
            const createTime = new Date().toISOString();
            const assignedTime = assignedTo ? new Date().toISOString() : null;
    
            const newCampaign = new CampaignModel({
                name,
                groupId,
                campaignId,
                userId,
                managerId,
                start_date,
                end_date,
                createTime,
                assignedTime,
                status,
                description,
                type,
                totalLead,
                assignedTo: operatorData ? operatorData.name : null,
                handledBy: assignedTo,
                Leads: leadData,
                templates: templateData,
                createdBy: loggedUserId,
                updatedBy: loggedUserId,
            });
                await newCampaign.save();
    
            return {
                message: "Campaign created successfully and data posted to campaign",
                data: newCampaign
            };
        } catch (error) {
            console.error("Error creating campaign:", error);
            throw new Error("Error creating campaign");
        }
    }
    

    async countGroupAndDate(groupId, handledBy, start_date, end_date, userId, name, assignedTo, status, type, search) {
        try {
            const widget = await WidgetsModel.findOne({ name: "campaign" }).lean().exec();

            const userWidget = await UserWidgetsModel.findOne({ groupId: groupId, userId: userId, widgetId: widget.widgetId }).lean().exec();

            if (userWidget && !userWidget.isDashboardVisible) {
                return {
                    status: "Error",
                    message: "You do not have visibility to view campaign counts."
                };
            }

            const pipeline = [];

            pipeline.push({
                $match: {
                    groupId: parseInt(groupId),
                    ...(start_date && end_date ? {
                        createTime: {
                            $gte: new Date(start_date),
                            $lte: new Date(new Date(end_date).setUTCHours(23, 59, 59, 999))
                        }
                    } : {})
                }
            });

            const filters = [];
            if (handledBy !== undefined) filters.push({ handledBy: parseInt(handledBy) });
            if (name) filters.push({ name: new RegExp(name, "i") });
            if (assignedTo) filters.push({ assignedTo: new RegExp(assignedTo, "i") });
            if (status) filters.push({ status: new RegExp(status, "i") });
            if (type) filters.push({ type: new RegExp(type, "i") });
            if (search) {
                const criteria = search.split(",");
                filters.push({ $or: criteria.map(criterion => ({ name: new RegExp(criterion, "i") })) });
            }
            if (filters.length > 0) pipeline.push({ $match: { $and: filters } });

            pipeline.push({
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    uniqueOperators: { $addToSet: "$assignedTo" },
                    totalLeads: { $sum: "$totalLead" || 0 },
                    completedCampaigns: { $sum: { $cond: [{ $eq: ["$status", Completed] }, 1, 0] } },
                    inProgressCampaigns: { $sum: { $cond: [{ $eq: ["$status", INPROGRESS] }, 1, 0] } },
                    negativeLeads: { $sum: { $cond: [{ $eq: ["$status", Negative] }, 1, 0] } }
                }
            });

            pipeline.push({
                $project: {
                    _id: 0,
                    items: {
                        Current: "$totalCount",
                        Operators: { $size: "$uniqueOperators" },
                        leads: "$totalLeads",
                        Success: "$completedCampaigns",
                        InProgress: "$inProgressCampaigns",
                        Negative: "$negativeLeads"
                    }
                }
            });

            const result = await CampaignModel.aggregate(pipeline);

            return {
                status: "Success",
                data: result[0] || {}
            };
        } catch (error) {
            console.error("Error counting status:", error);
            throw new Error('Error counting status: ' + error.message);
        }
    }

    async updateCampaignLeads(groupId, campaignId, leadId, updatedLeadData) {
        try {
            if (!groupId || !campaignId || !leadId || !updatedLeadData) {
                throw new Error("Missing required data for updating campaign lead");
            }

            const updatedLead = await LeadsModel.findOneAndUpdate(
                { groupId, leadId },
                { $set: { ...updatedLeadData } },
                { new: true }
            );

            if (!updatedLead) {
                throw new Error('Lead not found');
            }

            let isHandled = true;
            const { status } = updatedLeadData;

            if (status === NewLeads || status === Open) {
                isHandled = false;
            }

            const campaign = await CampaignModel.findOne({ groupId, campaignId });

            if (!campaign) {
                throw new Error("Campaign not found");
            }

            const leadIndex = campaign.Leads.findIndex(lead => lead.leadId.toString() === leadId);

            if (leadIndex === -1) {
                throw new Error("Lead not found in campaign");
            }

            const { description, followUpDate, recordText, callDate, Time, leadCallTime, phoneNumber, name, type, source, location } = updatedLeadData;

            campaign.Leads[leadIndex] = {
                ...campaign.Leads[leadIndex],
                description: description,
                recordText: recordText,
                followUpDate: followUpDate,
                callDate: callDate,
                Time: Time,
                phoneNumber: phoneNumber,
                name: name,
                type: type,
                source: source,
                status: status,
                location: location,
                leadCallTime: leadCallTime,
                isHandled: isHandled
            };

            await campaign.save();

            if (status !== NewLeads) {
                const campaignHistory = new CampaignhistoryModel({
                    phoneNumber: phoneNumber,
                    name: name,
                    type: type,
                    source: source,
                    location: location,
                    isHandled: isHandled,
                    groupId,
                    campaignId,
                    leadId,
                    recordText,
                    status,
                    description,
                    followUpDate,
                    callDate,
                    Time,
                    campaignhistoryId: Date.now(),
                    leadCallTime,
                    assignedTo: campaign.assignedTo
                });

                await campaignHistory.save();
            }

            return campaign;
        } catch (error) {
            console.error("Error updating campaign lead:", error);
            return { success: false, message: "Failed to update campaign lead", error: error.message };
        }
    }

    async deleteCampaignLead(groupId, campaignId, leadId) {
        try {
            if (!groupId || !campaignId || !leadId) {
                throw new Error("Missing required data for deleting campaign lead");
            }
            const campaign = await CampaignModel.findOne({ groupId, campaignId });
            if (!campaign) {
                throw new Error("Campaign not found");
            }

            const leadIndex = campaign.Leads.findIndex(lead => lead.leadId.toString() === leadId);

            if (leadIndex === -1) {
                throw new Error("Lead not found in campaign");
            }

            campaign.Leads.splice(leadIndex, 1);

            await campaign.save();

            return { success: true, message: "Lead deleted from campaign successfully" };
        } catch (error) {
            console.error("Error deleting campaign lead:", error);
            return { success: false, message: "Failed to delete campaign lead", error: error.message };
        }
    }

    async getCampaignData(groupId, filters, page = 1, limit = 30) {
        try {
            const { name, handledBy, assignedTo, status, type, search } = filters;

            let matchStage = { groupId: parseInt(groupId) };

            if (name) matchStage.name = new RegExp(name, "i");
            if (handledBy) matchStage.handledBy = parseInt(handledBy);
            if (assignedTo) matchStage.assignedTo = new RegExp(assignedTo, "i");
            if (status) matchStage.status = new RegExp(status, "i");
            if (type) matchStage.type = new RegExp(type, "i");

            const criteria = search ? search.split(',') : [];
            if (criteria.length > 0) {
                matchStage.$or = criteria.map(criterion => ({ name: new RegExp(criterion, "i") }));
            }

            const totalCount = await CampaignModel.countDocuments(matchStage);

            const currentPage = page;
            const perPage = limit;
            const skip = (currentPage - 1) * perPage;

            const campaignDataPipeline = [
                { $match: matchStage },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        campaignId: 1,
                        groupId: 1,
                        name: 1,
                        start_date: 1,
                        end_date: 1,
                        assignedTo: 1,
                        totalLead: 1,
                        status: 1,
                        type: 1,
                        createTime: 1,
                        assignedTime: 1,
                        handledBy: 1,
                        currentLead: 1,
                        leadCallTime: 1
                    }
                },
                { $skip: skip },
                { $limit: perPage }
            ];

            const campaignData = await CampaignModel.aggregate(campaignDataPipeline).exec();

            return {
                message: 'Campaign data fetched successfully',
                items: campaignData,
                totalCount,
                totalPages: Math.ceil(totalCount / perPage),
                currentPage,
            };
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async updateCampaignStatus(groupId, campaignId, updateFields, updatedBy) {
        try {
            let assignedToName, handledBy;

            const campaign = await CampaignModel.findOne({ groupId: groupId, campaignId: campaignId });

            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const leadIds = campaign.Leads.map(lead => lead.leadId);

            const leads = await LeadsModel.find({ groupId: groupId, leadId: { $in: leadIds } });

            const hasOpenLeads = leads.some(lead => [Open, Neutral, NewLeads].includes(lead.status));
            if (updateFields.status === Completed && hasOpenLeads) {
                throw new Error("Cannot complete the campaign as there are leads with status open, neutral, or new");
            }

            if (updateFields.assignedTo) {
                const operator = await OperatorsModel.findOne({ empId: updateFields.assignedTo });

                if (operator) {
                    assignedToName = operator.name;
                    handledBy = updateFields.assignedTo;
                }

                const campaignLeadsUpdate = await CampaignModel.updateMany(
                    { groupId: groupId, campaignId: campaignId },
                    { $set: { 'Leads.$[].assignedTo': updateFields.assignedTo } }
                );

                if (campaignLeadsUpdate.nModified === 0) {
                    throw new Error('No campaign leads were updated');
                }

                const leadsUpdate = await LeadsModel.updateMany(
                    { groupId: groupId, leadId: { $in: leadIds } },
                    { $set: { assignedTo: updateFields.assignedTo } }
                );

                if (leadsUpdate.nModified === 0) {
                    throw new Error('No leads were updated');
                }
            }

            const updateQuery = {
                updatedBy,
                assignedTo: assignedToName,
                handledBy,
                ...(updateFields.assignedTo && { assignedTime: new Date().toISOString() }),
                ...(updateFields.status && { status: updateFields.status }),
                ...(updateFields.description && { description: updateFields.description }),
                ...(updateFields.name && { name: updateFields.name }),
                ...(updateFields.lastCallLead && { lastCallLead: updateFields.lastCallLead }),
                ...(updateFields.currentLead && { currentLead: updateFields.currentLead }),
                ...(updateFields.leadCallTime && { leadCallTime: updateFields.leadCallTime }),
                ...updateFields
            };

            let updatedCampaign
            if (updateFields.status == NewLeads) {
                updatedCampaign = await CampaignModel.findOneAndUpdate(
                    { groupId, campaignId },
                    {
                        $set: {
                            ...updateQuery,
                            'Leads.$[elem].isHandled': false,
                            currentLead: 0
                        }
                    },
                    {
                        new: true,
                        arrayFilters: [{ 'elem.leadId': { $in: leadIds } }]
                    }
                );
            } else {
                updatedCampaign = await CampaignModel.findOneAndUpdate(
                    { groupId, campaignId },
                    updateQuery,
                    { new: true }
                );
            }

            if (!updatedCampaign) {
                throw new Error("Failed to update campaign");
            }

            return updatedCampaign;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAllExecutionLeads(groupId, campaignId, filters, page, limit) {
        try {
            let query = { groupId: groupId, campaignId: campaignId };

            const campaignData = await CampaignModel.findOne(query);

            if (!campaignData) {
                throw new Error("No data found for the specified groupId and campaignId");
            }

            let filteredLeads = campaignData.Leads || [];

            if (filters) {
                if (filters.assignedTo) {
                    filteredLeads = filteredLeads.filter(lead => lead.assignedTo === filters.assignedTo);
                }

                if (filters.userId) {
                    filteredLeads = filteredLeads.filter(lead => lead.userId === filters.userId);
                }

                if (filters.leadId) {
                    filteredLeads = filteredLeads.filter(lead => lead.leadId === filters.leadId);
                }

                if (filters.type) {
                    filteredLeads = filteredLeads.filter(lead => lead.type === filters.type);
                }

                if (filters.source) {
                    filteredLeads = filteredLeads.filter(lead => lead.source === filters.source);
                }

                if (filters.status) {
                    filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
                }

                if (filters.location) {
                    const locationRegex = new RegExp(filters.location, "i");
                    filteredLeads = filteredLeads.filter(lead => lead.location.toLowerCase().match(locationRegex));
                }

                if (filters) {
                    if (filters.phoneNumber) {
                        const phoneNumber = parseInt(filters.phoneNumber);
                        if (!isNaN(phoneNumber)) {
                            filteredLeads = filteredLeads.filter(lead => lead.phoneNumber === phoneNumber);
                        }
                    }

                    if (filters.search) {
                        const searchValue = filters.search.toLowerCase();
                        filteredLeads = filteredLeads.filter(lead => {

                            return Object.values(lead).some(value => {
                                if (typeof value === "string") {
                                    return value.toLowerCase().includes(searchValue);
                                } else if (typeof value === "number") {
                                    return value.toString().includes(searchValue);
                                }
                                return false;
                            });
                        });
                    }
                }
            }

            filteredLeads = filteredLeads.map((lead, index) => ({
                ...lead,
                index: index + 1
            }));

            const openStatusLeads = filteredLeads.filter(lead => lead.status === Open);
            const otherStatusLeads = filteredLeads.filter(lead => lead.status !== Open);

            filteredLeads = [...otherStatusLeads, ...openStatusLeads];

            filteredLeads = filteredLeads.filter(lead => lead.isHandled !== true && lead.status !== "feature");

            const totalItemsCount = filteredLeads.length;
            const totalPages = Math.ceil(totalItemsCount / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + limit, totalItemsCount);
            const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

            return {
                items: paginatedLeads,
                totalItemsCount,
                totalPages,
                currentPage: page
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllLeads(groupId, campaignId, filters, page, limit) {
        try {
            let query = { groupId: groupId, campaignId: campaignId };

            const campaignData = await CampaignModel.findOne(query);

            if (!campaignData) {
                throw new Error("No data found for the specified groupId and campaignId");
            }

            let filteredLeads = campaignData.Leads || [];

            filteredLeads = filteredLeads.map(lead => ({
                ...lead,
                isHandled: lead.isHandled !== undefined ? lead.isHandled : false
            }));

            if (filters) {
                if (filters.assignedTo) {
                    filteredLeads = filteredLeads.filter(lead => lead.assignedTo === filters.assignedTo);
                }

                if (filters.userId) {
                    filteredLeads = filteredLeads.filter(lead => lead.userId === filters.userId);
                }

                if (filters.leadId) {
                    filteredLeads = filteredLeads.filter(lead => lead.leadId === filters.leadId);
                }

                if (filters.type) {
                    filteredLeads = filteredLeads.filter(lead => lead.type === filters.type);
                }

                if (filters.source) {
                    filteredLeads = filteredLeads.filter(lead => lead.source === filters.source);
                }

                if (filters.status) {
                    filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
                }

                if (filters.location) {
                    const locationRegex = new RegExp(filters.location, "i");
                    filteredLeads = filteredLeads.filter(lead => lead.location.toLowerCase().match(locationRegex));
                }

                if (filters.isHandled !== undefined) {
                    const isHandled = filters.isHandled === 'true';
                    filteredLeads = filteredLeads.filter(lead => lead.isHandled === isHandled);
                }

                if (filters.phoneNumber) {
                    const phoneNumber = parseInt(filters.phoneNumber);
                    if (!isNaN(phoneNumber)) {
                        filteredLeads = filteredLeads.filter(lead => lead.phoneNumber === phoneNumber);
                    }
                }

                if (filters.search) {
                    const searchValue = filters.search.toLowerCase();
                    filteredLeads = filteredLeads.filter(lead => {
                        return Object.values(lead).some(value => {
                            if (typeof value === "string") {
                                return value.toLowerCase().includes(searchValue);
                            } else if (typeof value === "number") {
                                return value.toString().includes(searchValue);
                            }
                            return false;
                        });
                    });
                }
            }

            filteredLeads = filteredLeads.map((lead, index) => ({
                ...lead,
                index: index + 1
            }));

            const totalItemsCount = filteredLeads.length;
            limit = limit || totalItemsCount;
            const totalPages = Math.ceil(totalItemsCount / limit);

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + limit, totalItemsCount);
            const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

            return {
                message: "Leads data fetched successfully",
                data: { items: paginatedLeads },
                totalItemsCount,
                totalPages,
                currentPage: page
            };
        } catch (error) {
            throw error;
        }
    }

    async countLeadsByCampaignId(groupId, campaignId) {
        try {

            const campaignData = await CampaignModel.findOne({ groupId, campaignId });

            if (!campaignData) {
                return { message: "Campaign not found for the given campaignId." };
            }

            const leads = campaignData.Leads;

            const leadCounts = {
                totalLeadsCount: 0,
                NewLeads: 0,
                PositiveLeads: 0,
                NegativeLeads: 0,
                NeutralLeads: 0,
                WonLeads: 0,
                LostLeads: 0,
                OpenLeads: 0,
                Counselling: 0,
                CounsellingDone: 0
            };

            leads.forEach((lead) => {
                switch (lead.status) {
                    case NewLeads:
                        leadCounts["NewLeads"]++;
                        break;
                    case Positive:
                        leadCounts["PositiveLeads"]++;
                        break;
                    case Negative:
                        leadCounts["NegativeLeads"]++;
                        break;
                    case Neutral:
                        leadCounts["NeutralLeads"]++;
                        break;
                    case Won:
                        leadCounts["WonLeads"]++;
                        break;
                    case Lost:
                        leadCounts["LostLeads"]++;
                        break;
                    case Open:
                        leadCounts["OpenLeads"]++;
                        break;
                    case Counselling:
                        leadCounts["Counselling"]++;
                        break;
                    case CounsellingDone:
                        leadCounts["CounsellingDone"]++;
                        break;
                }
                leadCounts["totalLeadsCount"]++;
            });

            return {
                status: "Success",
                data: {
                    items: leadCounts,
                },
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getFilteredLeads(groupId, campaignId) {
        const today = new Date();

        try {
            const campaign = await CampaignModel.findOne({ groupId, campaignId });

            if (!campaign) {
                return [];
            }

            const leads = campaign.Leads.slice();

            const currentLeads = [];
            const upcomingLeads = [];
            const oldLeads = [];

            leads.forEach(lead => {
                const followUpDate = new Date(lead.followUpDate);
                if (followUpDate.toDateString() === today.toDateString()) {
                    currentLeads.push(lead);
                } else if (followUpDate > today) {
                    upcomingLeads.push(lead);
                } else {
                    oldLeads.push(lead);
                }
            });

            const sortedLeads = [...currentLeads, ...upcomingLeads].sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

            return sortedLeads;
        } catch (error) {
            throw new Error("Error fetching leads: " + error.message);
        }
    }

    async getAllLeadData(groupId, filters, page, limit) {
        try {
            const query = { groupId: groupId, deleted: { $nin: [true] } };

            if (filters) {
                if (filters.assignedTo) {
                    query.assignedTo = filters.assignedTo;
                }
                if (filters.userId) {
                    query.userId = filters.userId;
                }
                if (filters.leadId) {
                    query.leadId = filters.leadId;
                }
                if (filters.type) {
                    query.type = filters.type;
                }
                if (filters.source) {
                    query.source = filters.source;
                }
                if (filters.status) {
                    query.status = filters.status;
                }
                if (filters.location) {
                    query.location = filters.location;
                }
                if (filters.phoneNumber && /^\d+$/.test(filters.phoneNumber)) {
                    query.phoneNumber = filters.phoneNumber;
                }

                if (filters.search) {
                    const searchRegex = { $regex: new RegExp(`.*${filters.search}.*`, "i") };
                    query.$or = [
                        { name: searchRegex },
                        { status: searchRegex },
                        { source: searchRegex },
                        { type: searchRegex },
                        { location: searchRegex },
                        { assignedTo: searchRegex }
                    ];
                }
            }

            const allCampaigns = await CampaignModel.find({ groupId })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .exec();

            const campaignLeadIds = allCampaigns.reduce((acc, campaign) => {
                if (campaign.Leads && campaign.Leads.length) {
                    const leadIds = campaign.Leads.map(lead => {
                        if (lead && lead.leadId) {
                            return lead.leadId.toString();
                        } else {
                            console.error("Invalid lead object:", lead);
                            return null;
                        }
                    }).filter(id => id !== null);
                    acc.push(...leadIds);
                }
                return acc;
            }, []);

            const excludedLeads = await LeadsModel.find({
                groupId: groupId,
                leadId: { $nin: campaignLeadIds },
                ...query
            })
            const totalCount = excludedLeads.length;
            const currentPage = parseInt(page, 10) || 1;
            const perPage = parseInt(limit, 10) || 30;
            const totalPages = Math.ceil(totalCount / perPage);
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, totalCount);

            const leads = excludedLeads.slice(startIndex, endIndex);

            return {
                success: true,
                message: "Leads fetched successfully",
                data: leads,
                totalItems: totalCount,
                currentPage: currentPage,
                totalPages: totalPages,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAssignedCampaign(groupId, filters, page = 1, limit = 30) {
        try {
            const { name, handledBy, assignedTo, status, type, start_date, end_date, search } = filters;

            let matchStage = { groupId: parseInt(groupId) };

            if (name) matchStage.name = new RegExp(name, "i");
            if (handledBy) matchStage.handledBy = parseInt(handledBy);
            if (assignedTo) matchStage.assignedTo = new RegExp(assignedTo, "i");
            if (status) matchStage.status = new RegExp(status, "i");
            if (type) matchStage.type = new RegExp(type, "i");
            if (search) {
                const criteria = search.split(",");
                if (criteria.length > 0) {
                    matchStage.$or = criteria.map(criterion => ({ name: new RegExp(criterion, "i") }));
                }
            }
            if (start_date !== undefined && end_date !== undefined) {
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);
                endDate.setUTCHours(23, 59, 59, 999);

                matchStage.createTime = {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString(),
                };
            }

            const totalCount = await CampaignModel.countDocuments(matchStage);

            const currentPage = parseInt(page) || 1;
            const perPage = parseInt(limit) || 30;
            const skip = (currentPage - 1) * perPage;

            const campaignDataPipeline = [
                { $match: matchStage },
                { $skip: skip },
                { $limit: perPage },
                { $sort: { _id: -1 } },
                {
                    $project: {
                        campaignId: 1,
                        groupId: 1,
                        name: 1,
                        start_date: 1,
                        end_date: 1,
                        assignedTo: 1,
                        totalLead: 1,
                        status: 1,
                        type: 1,
                        createTime: 1,
                        assignedTime: 1,
                        handledBy: 1,
                        currentLead: 1,
                        leadCallTime: 1
                    }
                }

            ];
            const campaignData = await CampaignModel.aggregate(campaignDataPipeline);
            const countResult = await this.countGroupAndDate(groupId, handledBy, start_date, end_date, assignedTo, search);
            return {
                message: "Campaign data fetched successfully",
                items: campaignData,
                campaignCount: countResult.data.items,
                totalCount,
                totalPages: Math.ceil(totalCount / perPage),
                currentPage,
            };
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }
    async getCampaignLeads(groupId, campaignId) {
        try {
            const campaign = await CampaignModel.findOne({ groupId: groupId, campaignId: campaignId });

            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const leads = campaign.Leads.filter(lead => lead !== null);

            return leads;
        } catch (error) {
            console.error('Error fetching campaign leads:', error.message);
            throw new Error('Internal Server Error');
        }
    }
}
module.exports = new CampaignService(CampaignModel, "campaign");
