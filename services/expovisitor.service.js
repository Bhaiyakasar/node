const ExpoVisitorModel = require("../schema/expovisitor.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");

class ExpoVisitorService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };
        if (criteria.name) query.name = new RegExp(criteria.name, "i");
        if (criteria.phoneNumber) query.phoneNumber = criteria.phoneNumber
        if (criteria.startDate && criteria.endDate) {
            query.dateTime = { $gte: criteria.startDate, $lte: criteria.endDate };
        }
        if (criteria.userId) query.userId = criteria.userId
        if (criteria.appId) query.appId = criteria.appId

        return this.preparePaginationAndReturnData(query, criteria);
    }

    async getByexpoVisitorId(groupId, expoVisitorId) {
        return this.execute(async () => {
            const query = {
                groupId: groupId,
                expoVisitorId: expoVisitorId
            };
            return await this.getAllByCriteria(query);
        });
    }

    async findByPhoneNumber(phoneNumber, groupId) {
        try {
            const existingMember = await ExpoVisitorModel.findOne(phoneNumber, groupId);
            console.log(existingMember);
            return existingMember;
        } catch (error) {
            console.error("Error finding member by phoneNumber:", error);
            throw error;
        }
    }

    async checkExpoVisitorExists(groupId, userId) {
        try {
            const query = {
                groupId,
                userId,
            };

            const expoVisitor = await ExpoVisitorModel.find(query);
            return Boolean(expoVisitor.length);
        } catch (error) {
            console.error("Error checking expoVisitor existence:", error);
            throw error;
        }
    }

    async updateExpoVisitorByUserId(groupId, userId, data) {
        try {
            let updateFields = { ...data };

            if (data.status === "in" && !data.inTime) {
                updateFields.inTime = new Date().toISOString();
            } else if (data.status === "out" && !data.outTime) {
                updateFields.outTime = new Date().toISOString();
            }
            const resp = await ExpoVisitorModel.findOneAndUpdate(
                { groupId: groupId, userId: userId },
                updateFields,
                { upsert: true, new: true }
            );
            return new ServiceResponse({
                data: resp,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    async countLeadsByGroupAndDate(groupId, start_date, end_date) {
        try {
            const totalCountPipeline = [
                {
                    $match: {
                        groupId: groupId,
                        createdAt: {
                            $gte: new Date(start_date),
                            $lte: new Date(end_date)
                        },
                        deleted: { $nin: [true] }
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCount: 1
                    }
                }
            ];

            const inOutCountPipeline = [
                {
                    $match: {
                        groupId: groupId,
                        $or: [
                            { inTime: { $gte: start_date, $lte: end_date } },
                            { outTime: { $gte: start_date, $lte: end_date } }
                        ],
                        deleted: { $nin: [true] }
                    },
                },
                {
                    $group: {
                        _id: null,
                        inCount: { $sum: { $cond: [{ $gte: ["$inTime", start_date] }, 1, 0] } },
                        outCount: { $sum: { $cond: [{ $gte: ["$outTime", start_date] }, 1, 0] } },
                    }
                },
                {
                    $project: {
                        _id: 0,
                        inCount: 1,
                        outCount: 1,
                    }
                }
            ];

            const [totalVisitorResult, inOutCountResult] = await Promise.all([
                ExpoVisitorModel.aggregate(totalCountPipeline),
                ExpoVisitorModel.aggregate(inOutCountPipeline)
            ]);

            const totalVisitors = totalVisitorResult.length > 0 ? totalVisitorResult[0].totalCount : 0;
            const inCount = inOutCountResult.length > 0 ? inOutCountResult[0].inCount : 0;
            const outCount = inOutCountResult.length > 0 ? inOutCountResult[0].outCount : 0;

            return {
                status: "Success",
                data: {
                    items: {
                        inCount: inCount,
                        outCount: outCount,
                        totalCount: totalVisitors
                    }
                }
            };
        } catch (error) {
            console.error('Error counting leads:', error);
            throw new Error('Error counting leads: ' + error.message);
        }
    }

}

module.exports = new ExpoVisitorService(ExpoVisitorModel, 'expovisitor');
