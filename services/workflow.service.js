const WorkflowModel = require("../schema/workflow.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class WorkflowService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getPhoneNumbersByGroupAndEvent(groupId, eventName) {
        try {

            const workflows = await WorkflowModel.find({ groupId: groupId, event: eventName });

            const phoneNumbers = workflows.reduce((numbers, workflow) => {
                workflow.listener.forEach(listener => {
                    numbers.push(listener.phoneNumber);
                });
                return numbers;
            }, []);

            return { phoneNumbers };
        } catch (error) {
            throw new Error("Error fetching workflow phone numbers.");
        }
    }

}

module.exports = new WorkflowService(WorkflowModel, 'workflow');
