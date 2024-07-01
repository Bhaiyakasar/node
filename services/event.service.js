const EventModel = require("../schema/event.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class EventService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    async getByEventId(groupId) {
        return this.execute(() => {
            return this.model.findOne({
                groupId: groupId,
                isEventActive: true,
            });
        });
    }

    async getByGroupIdAndEventId(groupId, eventId) {
        return this.execute(() => {
            return this.model.findOne({ groupId: groupId, eventId: eventId });
        });
    }

    async getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };

        if (criteria.name) query.name = new RegExp(criteria.name, "i");
        if (criteria.eventId) query.eventId = criteria.eventId;
        if (criteria.isEventActive)
            query.isEventActive = criteria.isEventActive;

        return this.preparePaginationAndReturnData(query, criteria);
    }

    async addFeedback(groupId, eventId, feedback) {
        return this.execute(() => {
            return this.model.findOneAndUpdate(
                { groupId: groupId, eventId: eventId },
                { $push: { feedback: feedback } },
                { new: true }
            );
        });
    }
}

module.exports = new EventService(EventModel, "event");
