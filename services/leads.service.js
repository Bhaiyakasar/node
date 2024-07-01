const LeadsModel = require("../schema/leads.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const OperatorsModel = require("../schema/operators.schema");
const ConfigurationModel = require("../schema/configuration.schema");
const WidgetsModel = require("../schema/widgets.schema");
const UserWidgetsModel = require("../schema/userwidgets.schema");
const status = require("../config/status");
const CampaignModel = require("../schema/campaign.schema");
const CampaignHistoryModel = require("../schema/campaignhistory.schema");

class LeadsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async findByPhoneNumber(groupId, phoneNumber) {
        try {
            const lead = await LeadsModel.findOne({ groupId, phoneNumber });
            return lead;
        } catch (error) {
            console.error("Error finding lead by phone number:", error);
            throw new Error(
                "Error finding lead by phone number: " + error.message
            );
        }
    }

    async getAlleads(
        groupId,
        assignedTo,
        createdBy,
        userId,
        leadId,
        type,
        source,
        status,
        location,
        phoneNumber,
        page = 1,
        pageSize = 30,
        search
    ) {
        try {
            let query = {
                groupId,
                deleted: { $nin: [true] },
            };
            if (assignedTo) {
                query.assignedTo = parseInt(assignedTo);
            }
            if (createdBy) {
                query.createdBy = parseInt(createdBy);
            }

            if (userId) {
                query.userId = userId;
            }

            if (leadId) {
                query.leadId = leadId;
            }

            if (type) {
                query.type = type;
            }

            if (source) {
                query.source = source;
            }

            if (status) {
                query.status = status;
            }

            if (location) {
                query.location = { $regex: new RegExp(location, "i") };
            }

            if (phoneNumber && /^\d+$/.test(phoneNumber)) {
                query.phoneNumber = phoneNumber;
            }

            if (search) {
                const numericSearch = parseInt(search);
                const searchRegex = new RegExp(search, "i");
                query.$or = [
                    { name: searchRegex },
                    { status: searchRegex },
                    { source: searchRegex },
                    { location: searchRegex },
                    { type: searchRegex },
                    { assignedTo: searchRegex },
                    { tag: { $in: search.split(",") } },
                ];
                if (!isNaN(numericSearch)) {
                    query.$or.push({ phoneNumber: numericSearch });
                }
            }

            const [leads, totalItems] = await Promise.all([
                LeadsModel.find(query)
                    .skip((page - 1) * pageSize)
                    .limit(Number(pageSize))
                    .sort({ createdAt: -1 })
                    .exec(),
                LeadsModel.countDocuments(query),
            ]);

            const operatorIds = leads.map((lead) => lead.assignedTo);
            const operatorData = await OperatorsModel.find({
                empId: { $in: operatorIds },
            });
            const operatorDataMap = new Map();
            operatorData.forEach((operator) =>
                operatorDataMap.set(operator.empId, operator)
            );
            leads.forEach((lead) => {
                const assignedTo = lead.assignedTo;
                if (typeof assignedTo === "string") {
                    const assignedToNumber = parseInt(assignedTo);
                    if (!isNaN(assignedToNumber)) {
                        const operator = operatorDataMap.get(assignedToNumber);
                        if (operator) {
                            lead.assignedTo = {
                                assignedTo: assignedToNumber,
                                name: operator.name,
                            };
                        }
                    }
                } else if (typeof assignedTo === "number") {
                    const operator = operatorDataMap.get(assignedTo);
                    if (operator) {
                        lead.assignedTo = {
                            assignedTo: assignedTo,
                            name: operator.name,
                        };
                    }
                }
            });

            const totalPages = Math.ceil(totalItems / pageSize);

            return {
                data: {
                    items: leads,
                    totalItems: totalItems,
                    page: Number(page),
                    pageSize: Number(pageSize),
                    totalPages,
                },
            };
        } catch (error) {
            console.error("Error fetching leads:", error);
            throw new Error(error.message);
        }
    }

    async bulkUploadLead(data) {
        try {
            const {
                phoneNumber,
                name,
                groupId,
                location,
                tag,
                type,
                source,
                createdBy,
                updatedBy,
            } = data;

            const phoneNumberRegex = /^\d{10}$/;
            if (!phoneNumberRegex.test(phoneNumber)) {
                console.log("Invalid phone number format:", phoneNumber);
                return "Invalid phone number format";
            }

            const leadData = {
                groupId: groupId,
                leadId: Date.now(),
                phoneNumber: phoneNumber,
                name: name,
                date: new Date().toISOString(),
                location: location,
                tag: tag,
                type: type,
                source: source,
                createdBy: createdBy,
                updatedBy: updatedBy,
            };

            const existingLead = await LeadsModel.findOne({
                groupId: groupId,
                phoneNumber: phoneNumber,
            });

            if (existingLead) {
                console.log("Lead with phoneNumber already exists.");
                return "Lead with phoneNumber already exists.";
            } else {
                console.log("Creating new lead:", leadData);
                const newLead = await LeadsModel.create(leadData);
                return newLead;
            }
        } catch (error) {
            console.error("Error uploading lead to MongoDB:", error.message);
            throw error;
        }
    }

    async countLeadsByGroupAndDate(
        groupId,
        assignedTo,
        start_date,
        end_date,
        createdBy,
        userId,
        leadId,
        type,
        source,
        status,
        location,
        phoneNumber,
        search
    ) {
        try {
            const matchQuery = {
                groupId: parseInt(groupId),
                deleted: { $nin: [true] },
            };

            if (assignedTo) matchQuery.assignedTo = parseInt(assignedTo);
            if (createdBy) matchQuery.createdBy = parseInt(createdBy);
            if (userId) matchQuery.userId = userId;
            if (leadId) matchQuery.leadId = leadId;
            if (type) matchQuery.type = type;
            if (source) matchQuery.source = source;
            if (status) matchQuery.status = status;
            if (location)
                matchQuery.location = { $regex: new RegExp(location, "i") };
            if (phoneNumber && /^\d+$/.test(phoneNumber))
                matchQuery.phoneNumber = phoneNumber;

            if (search) {
                const numericSearch = parseInt(search);
                const searchConditions = [
                    { name: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                    { source: { $regex: search, $options: "i" } },
                    { location: { $regex: search, $options: "i" } },
                    { type: { $regex: search, $options: "i" } },
                    { assignedTo: { $regex: search, $options: "i" } },
                ];
                if (!isNaN(numericSearch))
                    searchConditions.push({ phoneNumber: numericSearch });
                matchQuery.$or = searchConditions;
            }

            if (start_date !== undefined && end_date !== undefined) {
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);
                endDate.setUTCHours(23, 59, 59, 999);

                matchQuery.date = {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString(),
                };
            }

            const configuration = await ConfigurationModel.findOne({
                groupId,
                leadsStatus: { $exists: true },
            });

            if (!configuration) {
                throw new Error(
                    "No configuration found for the specified groupId"
                );
            }

            const leadsStatusArray = configuration.leadsStatus;

            const formattedStatusCounts = {};
            leadsStatusArray.forEach((status) => {
                formattedStatusCounts[status.toLowerCase()] = 0;
            });

            const aggregationPipeline = [
                { $match: matchQuery },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ];

            const statusCounts = await LeadsModel.aggregate(
                aggregationPipeline
            );

            statusCounts.forEach((item) => {
                formattedStatusCounts[item._id.toLowerCase()] = item.count;
            });

            const totalLeadsCount = Object.values(formattedStatusCounts).reduce(
                (acc, count) => acc + count,
                0
            );
            formattedStatusCounts.totalLeads = totalLeadsCount;

            return {
                status: "Success",
                data: {
                    items: formattedStatusCounts,
                },
            };
        } catch (error) {
            throw new Error(`Error counting leads: ${error.message}`);
        }
    }

    async deleteDataById(groupId, leadIds) {
        try {
            const leadIdsArray = Array.isArray(leadIds) ? leadIds : [leadIds];

            const leads = await LeadsModel.updateMany(
                { groupId, leadId: { $in: leadIdsArray } },
                { $set: { deleted: true } },
                { new: true }
            );

            return leads;
        } catch (error) {
            throw error;
        }
    }

    async updateLeadsById(groupId, leadId, newData) {
        let leads = await LeadsModel.findOneAndUpdate(
            { groupId: groupId, leadId: leadId },
            newData,
            { new: true }
        );

        return {
            data: {
                items: leads,
            },
        };
    }

    async getAllDataByGroupId(groupId, query) {
        try {
            const aggregationPipeline = [
                { $match: { groupId: parseInt(groupId) } },
                ...(query.location
                    ? [
                          {
                              $match: {
                                  location: {
                                      $regex: new RegExp(query.location, "i"),
                                  },
                              },
                          },
                      ]
                    : []),
                { $group: { _id: "$location" } },
            ];

            const uniqueLocations = await LeadsModel.aggregate(
                aggregationPipeline
            );

            const response = {
                status: "Success",
                data: {
                    items: uniqueLocations.map((location) => location._id),
                    totalItemsCount: uniqueLocations.length,
                },
            };

            return response;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async getUserLeads(groupId, empId) {
        try {
            const userLeads = await LeadsModel.find({
                groupId: groupId,
                assignedTo: empId,
            });
            return userLeads;
        } catch (error) {
            console.error("Error fetching user leads:", error);
            throw new Error("Error fetching user leads");
        }
    }
    getAllDataByGroupIds(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        // if (criteria.name) query.name = new RegExp(criteria.name, "i");

        if (criteria.userId) query.userId = criteria.userId;

        return this.preparePaginationAndReturnData(query, criteria);
    }
    async getFilteredLeads(groupId, empId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const leads = await LeadsModel.find({ groupId, assignedTo: empId });

            if (!leads || leads.length === 0) {
                return { count: 0, data: [] };
            }

            const todaysLeads = leads.filter((lead) => {
                const followUpDate = new Date(lead.followUpDate);
                const followUpDateMidnight = new Date(
                    followUpDate.getFullYear(),
                    followUpDate.getMonth(),
                    followUpDate.getDate()
                );
                return followUpDateMidnight.getTime() === today.getTime();
            });

            return { count: todaysLeads.length, data: todaysLeads };
        } catch (error) {
            throw new Error("Error fetching leads: " + error.message);
        }
    }

    async getAllByGroupIdAndAssignedToId(groupId, empId, userId) {
        try {
            const filters = { groupId };

            if (empId) {
                filters.empId = empId;
            }

            const widget = await WidgetsModel.findOne({ name: "leads" })
                .lean()
                .exec();

            const userWidget = await UserWidgetsModel.findOne({
                groupId: groupId,
                userId: userId,
                widgetId: widget.widgetId,
            })
                .lean()
                .exec();

            if (userWidget && !userWidget.isDashboardVisible) {
                return {
                    message: "You do not have visibility to view lead counts.",
                };
            }

            const operators = await OperatorsModel.find(filters);

            const configurations = await ConfigurationModel.find({
                groupId,
                performanceStatus: { $exists: true },
            });

            if (configurations.length === 0) {
                throw new Error(
                    "No configuration found for the specified groupId with performanceStatus defined"
                );
            }

            const configuration = configurations[0];

            const { performanceStatus } = configuration;

            const operatorDetailsWithCounts = await Promise.all(
                operators.map(async (operator) => {
                    const leadCountMap = {};
                    await Promise.all(
                        performanceStatus.map(async (status) => {
                            const countPipeline = [
                                {
                                    $match: {
                                        assignedTo: operator.empId,
                                        status,
                                    },
                                },
                                { $count: "count" },
                            ];
                            const countResult = await LeadsModel.aggregate(
                                countPipeline
                            );
                            leadCountMap[status] = countResult[0]
                                ? countResult[0].count
                                : 0;
                        })
                    );

                    return {
                        name: operator.name,
                        totalCount: Object.values(leadCountMap).reduce(
                            (acc, val) => acc + val,
                            0
                        ),
                        successCount:
                            (leadCountMap.positive || 0) +
                            (leadCountMap.won || 0),
                        lostCount:
                            (leadCountMap.lost || 0) +
                            (leadCountMap.negative || 0),
                        progressCount:
                            (leadCountMap.new || 0) +
                            (leadCountMap.neutral || 0),
                    };
                })
            );

            return operatorDetailsWithCounts;
        } catch (error) {
            console.error("Error fetching lead counts:", error);
            throw new Error("Error fetching lead counts: " + error.message);
        }
    }

    async getOpretorsAssignedLeads(
        groupId,
        assignedTo,
        createdBy,
        userId,
        start_date,
        end_date,
        page = 1,
        pageSize = 30,
        search
    ) {
        try {
            let query = {
                groupId,
                deleted: { $nin: [true] },
            };

            if (start_date !== undefined && end_date !== undefined) {
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);
                endDate.setUTCHours(23, 59, 59, 999);

                query.date = {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString(),
                };
            }

            if (assignedTo) {
                query.assignedTo = parseInt(assignedTo);
            }
            if (createdBy) {
                query.createdBy = parseInt(createdBy);
            }

            if (search) {
                const searchRegex = new RegExp(search, "i");
                query.$or = [
                    { name: searchRegex },
                    { status: searchRegex },
                    { source: searchRegex },
                    { location: searchRegex },
                    { type: searchRegex },
                    { assignedTo: searchRegex },
                ];
            }

            const [leads, totalItems] = await Promise.all([
                LeadsModel.find(query)
                    .select(
                        "leadId name phoneNumber status date source location type"
                    )
                    .skip((page - 1) * pageSize)
                    .limit(Number(pageSize))
                    .sort({ createdAt: -1 })
                    .exec(),
                LeadsModel.countDocuments(query),
            ]);

            const totalPages = Math.ceil(totalItems / pageSize);
            const countResult = await this.countLeadsByGroupAndDate(
                groupId,
                assignedTo,
                start_date,
                end_date,
                createdBy,
                search
            );

            return {
                data: {
                    items: leads,
                    leadCounts: countResult.data.items,
                    totalItems: totalItems,
                    page: Number(page),
                    pageSize: Number(pageSize),
                    totalPages,
                },
            };
        } catch (error) {
            console.error("Error fetching leads:", error);
            throw new Error("Error fetching leads: " + error.message);
        }
    }

    async exportLeadsToExcel(groupId, date, status, assignedTo) {
        try {
            const query = { groupId };

            if (date) {
                const startDate = new Date(date);
                const endDate = new Date(
                    startDate.getTime() + 24 * 60 * 60 * 1000
                );
                query.date = { $gte: startDate, $lt: endDate };
            }

            if (status) {
                query.status = status;
            }

            if (assignedTo) {
                query.assignedTo = assignedTo;
            }

            const leadsPromise = LeadsModel.find(query).lean().exec();

            const leads = await leadsPromise;

            const jsonData = leads.map((lead) => {
                return {
                    groupId: lead.groupId || "",
                    leadId: lead.leadId || "",
                    name: lead.name || "",
                    phoneNumber: lead.phoneNumber || "",
                    location: lead.location || "",
                    type: lead.type || "",
                    source: lead.source || "",
                    callDate: lead.callDate || "",
                    Time: lead.Time || "",
                    status: lead.status || "",
                    recordText: lead.recordText || "",
                };
            });

            return { data: { items: jsonData } };
        } catch (error) {
            console.error("Error:", error);
            throw new Error("Internal Server Error");
        }
    }

    async campaignHistory(data) {
        try {
            const {
                phoneNumber,
                response,
                groupId,
                calledOn,
                campaignId,
                leadId,
            } = data;

            const phoneNumberRegex = /^\d{10}$/;
            if (!phoneNumberRegex.test(phoneNumber)) {
                console.log("Invalid phone number format:", phoneNumber);
                return "Invalid phone number format";
            }
            const immediateResponse = `Lead with phoneNumber ${phoneNumber} update process started successfully.`;
            setImmediate(async () => {
                try {
                    const updateResult = await CampaignModel.updateOne(
                        { groupId: groupId, "Leads.phoneNumber": phoneNumber },
                        {
                            $set: {
                                "Leads.$.status": response,
                                "Leads.$.isHandled": true,
                            },
                        }
                    );
                    if (updateResult.nModified === 0) {
                        console.log(
                            `No campaign found for groupId ${groupId} and phoneNumber ${phoneNumber}`
                        );
                        return;
                    }

                    const existingHistory =
                        await CampaignHistoryModel.findOneAndUpdate(
                            {
                                groupId: groupId,
                                campaignId: campaignId,
                                phoneNumber: phoneNumber,
                            },
                            {
                                $set: {
                                    status: response,
                                    calledOn: calledOn,
                                    leadId: leadId,
                                },
                            },
                            { upsert: true, new: true }
                        );
                    return existingHistory;
                } catch (error) {
                    console.error(
                        "Error updating lead in MongoDB:",
                        error.message
                    );
                }
            });
            return immediateResponse;
        } catch (error) {
            console.error(
                "Error initializing lead update in MongoDB:",
                error.message
            );
            throw error;
        }
    }
}

module.exports = new LeadsService(LeadsModel, "leads");
