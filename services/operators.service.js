
const OperatorsModel = require("../schema/operators.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const LeadsModel = require("../schema/leads.schema");
const OrderModel = require("../schema/order.schema");
const status = require('../config/status')
const CUSTOMERCARE = status.CUSTOMERCARE;
const FIELDSALE = status.FIELDSALE;
const MANAGER = status.MANAGER;
const DIGITALMARKETER = status.DIGITALMARKETER;
const ACCOUNTANT = status.ACCOUNTANT;
const ConfigurationModel = require("../schema/configuration.schema");

class OperatorsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async findByPhoneNumber(groupId, phoneNumber) {
        try {
            const operator = await OperatorsModel.findOne({ groupId, phoneNumber });
            return operator;
        } catch (error) {
            console.error("Error finding operators by phone number:", error);
            throw new Error("Error finding operators by phone number: " + error.message);
        }
    }

    async getAllByGroupIdAndUserId(groupId, search, role, managerId, operatorId, page = 1, limit = 30) {
        try {
            const aggregationPipeline = [
                { $match: { groupId: parseInt(groupId) } },
            ];

            if (search) {
                aggregationPipeline.push({
                    $match: {
                        $or: [
                            { 'role.name': { $regex: new RegExp(search, 'i') } },
                            { 'name': { $regex: new RegExp(search, 'i') } },
                        ],
                    },
                });
            }

            if (role) {
                aggregationPipeline.push({ $match: { 'role.name': role } });
            }

            if (operatorId) {
                aggregationPipeline.push({ $match: { operatorId: operatorId } });
            }

            if (managerId) {
                aggregationPipeline.push({ $match: { managerId: managerId } });
            }

            aggregationPipeline.push({
                $project: {
                    role: 1,
                    name: 1,
                    reportingManager: 1,
                    phoneNumber: 1,
                    empId: 1,
                    department: 1,
                    location: 1,
                    operatorId: 1,
                    userId: 1,
                },
            });

            const totalDocuments = await OperatorsModel.countDocuments({ groupId: parseInt(groupId) });

            const totalPages = Math.ceil(totalDocuments / limit);

            page = Math.max(1, Math.min(page, totalPages));

            aggregationPipeline.push({ $skip: (page - 1) * limit });
            aggregationPipeline.push({ $limit: Number(limit) });

            aggregationPipeline.push({ $sort: { createdAt: -1 } });

            const [operatorData, configuration] = await Promise.all([
                OperatorsModel.aggregate(aggregationPipeline)
                    .allowDiskUse(true)
                    .exec(),
                ConfigurationModel.findOne({ groupId: groupId, role: { $exists: true } }, 'role').lean().exec(),
            ]);

            if (!configuration) {
                throw new Error('Role configuration not found for groupId: ' + groupId);
            }

            const configurationRoles = configuration.role;

            const roleCounts = { total: operatorData.length || 0, ...Object.fromEntries(configurationRoles.map(role => [role, 0])) };

            let totalOrders = 0;
            let totalLeads = 0;

            for (const operator of operatorData) {
                const [orderCountResult, leadCountResult] = await Promise.all([
                    OrderModel.countDocuments({ handledBy: operator.empId }),
                    LeadsModel.countDocuments({ assignedTo: operator.empId }),
                ]);

                const handledByCount = orderCountResult || 0;
                const createdByCount = leadCountResult || 0;

                totalOrders += handledByCount;
                totalLeads += createdByCount;

                operator.orderCounts = { handedBycount: handledByCount, createdBycount: createdByCount, orderCount: handledByCount + createdByCount };
                operator.leadCounts = { handedBycount: handledByCount, createdBycount: createdByCount, leadCount: handledByCount + createdByCount };

                if (operator.role && operator.role.name && configurationRoles.includes(operator.role.name)) {
                    roleCounts[operator.role.name] += operator.orderCounts.handedBycount + operator.leadCounts.handedBycount;
                }
            }

            return {
                data: operatorData,
                roleCounts,
                totalOrders,
                totalLeads,
                currentPage: page,
                totalPages,
                totalItems: totalDocuments,
            };
        } catch (error) {
            console.error('Error fetching operators:', error);
            throw new Error(error.message);
        }
    }


    async deleteDataById(groupId, operatorIds) {
        try {
            const operatorIdsArray = Array.isArray(operatorIds) ? operatorIds : [operatorIds];

            const result = await OperatorsModel.deleteMany(
                { groupId, operatorId: { $in: operatorIdsArray } }
            );

            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllMemberRoles(groupId) {
        try {
            const members = await OperatorsModel.find({ groupId }, { role: 1 }).lean();
            console.log(members);

            const roleNames = members.map(member => member.role && member.role.name).filter(Boolean);

            return roleNames;
        } catch (error) {
            console.error('Error fetching member roles:', error);
            throw error;
        }
    }

    async getAllManagerNames(groupId) {
        try {
            const members = await OperatorsModel.find({ groupId, "role.name": "manager" }, { name: 1 }).lean();
            console.log(members);

            const operatorNames = members.map(member => member.name).filter(Boolean);

            return operatorNames;
        } catch (error) {
            console.error('Error fetching member names:', error);
            throw error;
        }
    }

}


module.exports = new OperatorsService(OperatorsModel, 'operators');
