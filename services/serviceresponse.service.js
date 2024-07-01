const ServicerequestModel = require("../schema/servicerequest.schema");
const ServiceresponseModel = require("../schema/serviceresponse.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class ServiceresponseService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async createServiceResponse(data) {
        try {
            const serviceResponse = await this.create(data);

            if (data.servicerequestId) {
                const servicerequestId = data.servicerequestId;
                const groupId = data.groupId;
                const updatedFields = {};
                updatedFields.status = data.newStatus;
                updatedFields.assignedTo = data.handledBy;
                updatedFields.handledById = data.handledById;
                const serviceResponsesCount = await ServiceresponseModel.countDocuments({ servicerequestId, groupId });
                updatedFields.serviceResponsesCount = serviceResponsesCount;
                await ServicerequestModel.findOneAndUpdate(
                    { servicerequestId: servicerequestId },
                    { $set: updatedFields }
                );
            }

            return serviceResponse;
        } catch (error) {
            throw error;
        }
    }

    async getAllByGroupIdAndRequestId(groupId, servicerequestId) {
        try {


            const query = {
                groupId: groupId
            };
            if (servicerequestId) {
                query.servicerequestId = servicerequestId;
            }

            const serviceResponse = await ServiceresponseModel.find(query).sort({ createdAt: -1 });

            return serviceResponse;
        } catch (error) {

            throw error;
        }
    }

}




module.exports = new ServiceresponseService(ServiceresponseModel, 'serviceresponse');
