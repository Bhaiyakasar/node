const CampaignhistoryModel = require("../schema/campaignhistory.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const LeadsModel = require("../schema/leads.schema");
const { log } = require("winston");

class CampaignhistoryService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getDataBycampaignAndlead(groupId, campaignId, leadId, page, size,) {
        try {
            const query = { groupId, campaignId, leadId };

            const totalItemsCount = await CampaignhistoryModel.countDocuments(query);

            const totalPages = Math.ceil(totalItemsCount / size);
            const pageNumber = Math.max(1, Math.min(page, totalPages));

            const skip = (pageNumber - 1) * size;

            const data = await CampaignhistoryModel.find(query)
                .skip(skip)
                .limit(size)
                .sort({ createdAt: -1 })
                .exec();

            return {
                data,
                totalItemsCount,
                totalPages,
                page: pageNumber,
                size,
            };
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    }

    async updateCampaignhistory(groupId, campaignhistoryId, updatedData,) {
        try {
            const updatedCampaignHistory = await CampaignhistoryModel.findOneAndUpdate(
                { groupId, campaignhistoryId },
                updatedData,
                { new: true }
            );

            if (!updatedCampaignHistory) {
                throw new Error('Campaign history not found');
            }

            return updatedCampaignHistory;
        } catch (error) {
            console.error('Error updating campaign history:', error);
            throw new Error('Error updating campaign history');
        }
    }

    async getDataByCampaign(groupId, leadId, page, size) {
        try {
            let query = { groupId };
            if (leadId) {
                query.leadId = leadId;
            }
            const totalItemsCount = await CampaignhistoryModel.countDocuments(query);
            const totalPages = Math.ceil(totalItemsCount / size);
            const pageNumber = Math.max(1, Math.min(page, totalPages));
            const skip = (pageNumber - 1) * size;
            const data = await CampaignhistoryModel.find(query)
                .skip(skip)
                .limit(size)
                .sort({ createdAt: -1 })
                .exec();

            return {
                data,
                totalItemsCount,
                totalPages,
                page: pageNumber,
                size,
            };
        } catch (error) {
            console.error("Error fetching data:", error);
            throw new Error("Error fetching data: " + error.message);
        }
    }

    async exportLeadsToExcel(groupId, campaignId, callDate, assignedTo) {
        try {
            const query = { groupId };

            if (campaignId) {
                query.campaignId = campaignId;
            }

            if (callDate) {
                const startDate = new Date(callDate);
                const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                query.callDate = { $gte: startDate, $lt: endDate };
            }

            if (assignedTo) {
                query.assignedTo = assignedTo;
            }

            const leadsPromise = CampaignhistoryModel.find(query).lean().exec();

            const leads = await leadsPromise;
            const leadIds = leads.map(lead => lead.leadId);
            const leadDetailsPromise = LeadsModel.find({ leadId: { $in: leadIds }, groupId }).lean().exec();

            const [leadDetails] = await Promise.all([leadDetailsPromise]);

            const jsonData = leads.map(lead => {
                const leadDetail = leadDetails.find(detail => detail.leadId === lead.leadId);
                return {
                    name: leadDetail ? leadDetail.name || '' : '',
                    phoneNumber: leadDetail ? leadDetail.phoneNumber || '' : '',
                    location: leadDetail ? leadDetail.location || '' : '',
                    type: leadDetail ? leadDetail.type || '' : '',
                    source: leadDetail ? leadDetail.source || '' : '',
                    callDate: lead.callDate || '',
                    Time: lead.Time || '',
                    status: lead.status || '',
                    recordText: lead.recordText || ''
                };
            });

            return { data: { items: jsonData } };
        } catch (error) {
            console.error('Error:', error);
            throw new Error('Internal Server Error');
        }
    }

}

module.exports = new CampaignhistoryService(CampaignhistoryModel, 'campaignhistory');
