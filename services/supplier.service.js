const SupplierModel = require("../schema/supplier.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const CustomerModel = require("../schema/customer.schema");

class SupplierService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };
        if (criteria.name) query.name = new RegExp(criteria.name, "i");
        if (criteria.supplierId) query.supplierId = criteria.supplierId;
        return this.preparePaginationAndReturnData(query, criteria);
    }
    async updateAccountDetailsByUserId(supplierId, newAccountDetails, data) {
        try {
            const conditions = { supplierId: supplierId };
            const existingSupplier = await CustomerModel.findOne(conditions);

            if (!existingSupplier) {
                return new ServiceResponse({
                    isError: true,
                    message: 'supplier not found',
                });
            }

            console.log("Existing supplier:", existingSupplier);

            if (
                newAccountDetails &&
                existingSupplier.accountDetails &&
                existingSupplier.accountDetails.length > 0
            ) {
                const existingAccountDetails = existingSupplier.accountDetails[0].accountDetails;

                if (
                    JSON.stringify(newAccountDetails.accountDetails) ===
                    JSON.stringify(existingAccountDetails)
                ) {
                    return new ServiceResponse({
                        isError: true,
                        message: 'New account Details is the same as existing account details',
                    });
                }
            }

            if (newAccountDetails) {
                existingSupplier.accountDetails.push(newAccountDetails);
            }

            if (Object.keys(data).length > 0) {
                for (const field in data) {
                    existingSupplier[field] = data[field];
                }
            }

            const updatedCustomer = await existingSupplier.save();

            return new ServiceResponse({
                data: updatedCustomer,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }
    async updateShipping(supplierId, data) {
        try {
            const resp = await SupplierModel.findOneAndUpdate(
                { supplierId: supplierId },

                data,
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

    async updateAccountDetailsByUserId(supplierId, newAccountDetails, data) {
        try {
            const conditions = { supplierId: supplierId };
            const existingSupplier = await SupplierModel.findOne(conditions);

            if (!existingSupplier) {
                return new ServiceResponse({
                    isError: true,
                    message: 'supplier not found',
                });
            }

            console.log("Existing supplier:", existingSupplier);

            if (!existingSupplier.accountDetails) {
                existingSupplier.accountDetails = [];
            }

            if (
                newAccountDetails &&
                existingSupplier.accountDetails.length > 0
            ) {
                const existingAccountDetails = existingSupplier.accountDetails[0].accountDetails;

                if (
                    JSON.stringify(newAccountDetails.accountDetails) ===
                    JSON.stringify(existingAccountDetails)
                ) {
                    return new ServiceResponse({
                        isError: true,
                        message: 'New account Details is the same as existing account details',
                    });
                }
            }

            if (newAccountDetails) {
                existingSupplier.accountDetails.push(newAccountDetails);
            }

            if (Object.keys(data).length > 0) {
                for (const field in data) {
                    existingSupplier[field] = data[field];
                }
            }

            const updatedCustomer = await existingSupplier.save();

            return new ServiceResponse({
                data: updatedCustomer,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

}

module.exports = new SupplierService(SupplierModel, "supplier");
