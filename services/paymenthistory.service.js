const PaymenthistoryModel = require("../schema/paymenthistory.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class PaymenthistoryService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getPaymentHistory(groupId, orderId) {
        try {
            const paymentHistory = await PaymenthistoryModel.find({ groupId, orderId });
    
            return paymentHistory;
        } catch (error) {
            console.error(error);
            throw new Error('Error fetching payment history');
        }
    }
    
    
}

module.exports = new PaymenthistoryService(PaymenthistoryModel, 'paymenthistory');
