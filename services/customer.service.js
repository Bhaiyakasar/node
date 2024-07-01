const CustomerModel = require("../schema/customer.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const CartModel = require("../schema/cart.schema");
const { model } = require("mongoose");
const mongoose = require('mongoose');
const ServicerequestModel = require("../schema/servicerequest.schema");
const OrderModel = require("../schema/order.schema");

class CustomerService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    async findByPhoneNumber(phoneNumber, groupId) {
        try {

            const existingCustomer = await CustomerModel.findOne({ phoneNumber, groupId });
            return existingCustomer;
        } catch (error) {
            console.error("Error finding customer by phoneNumber:", error);
            throw error;
        }
    }

    async getAllRequestsByCriteria(criteria) {
        const query = {};

        if (criteria.groupId) {
            query.groupId = criteria.groupId;
        }

        if (criteria.phoneNumber) {
            query.phoneNumber = criteria.phoneNumber;
        }
        return this.getAllByCriteria(query);
    }

    async deleteAddressByGroupIdUserIdAddressId(groupId, userId, addressId) {
        try {
            const customer = await CustomerModel.findOne({ groupId, userId });

            if (!customer) {
                throw new Error("Customer not found");
            }

            const addressIndex = customer.addresses.findIndex((address) => address.addressId == addressId);

            if (addressIndex === -1) {
                throw new Error("Address not found");
            }

            customer.addresses.splice(addressIndex, 1);

            const updatedCustomer = await CustomerModel.findOneAndUpdate(
                { groupId, userId },
                { $set: { addresses: customer.addresses } },
                { new: true }
            );

            if (!updatedCustomer) {
                throw new Error("Failed to update customer");
            }

            return updatedCustomer;
        } catch (error) {
            return {
                status: "Error",
                message: error.message,
            };
        }
    }

    async getByUserId(userId) {
        return this.execute(() => {
            return this.model.findOne({ userId: userId });
        });
    }

    async getAllDataByGroupId(groupId, name, phoneNumber, userId, search, location, source, pageNumber, pageSize) {
        const query = {
            groupId: groupId,
        };

        if (name) query.name = new RegExp(name, "i");
        if (location) query.location = new RegExp(location, "i");
        if (phoneNumber) query.phoneNumber = phoneNumber;
        if (userId) query.userId = userId;
        if (source) query.source = new RegExp(source, "i");

        if (search) {
            const numericSearch = parseInt(search);
            const isNumeric = !isNaN(numericSearch);
            if (isNumeric) {
                query.$or = [
                    { name: new RegExp(search, "i") },
                    { phoneNumber: numericSearch },
                ];
            } else {
                query.$or = [
                    { name: new RegExp(search, "i") }
                ];
            }
        }

        const totalCount = await CustomerModel.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);

        const customerData = await CustomerModel.find(query)
            .sort({ createdAt: -1 })
            .skip(pageSize * (pageNumber - 1))
            .limit(pageSize)
            .lean();

        for (const customer of customerData) {
            const serviceCount = await ServicerequestModel.countDocuments({ userId: customer.userId });
            const orderCount = await OrderModel.countDocuments({ userId: customer.userId });
            customer.serviceCount = serviceCount;
            customer.orderCount = orderCount;
        }

        return {
            data: { items: customerData },
            totalItemsCount: totalCount,
            totalPages: totalPages
        };
    }


    async getByCustId(custId) {
        return this.execute(() => {
            return this.model.findOne({ custId: custId });
        });
    }

    async updateCustomer(custId, data) {
        try {
            const resp = await CustomerModel.findOneAndUpdate(
                { custId: custId },

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

    async updateCustomerByUserId(groupId, userId, newAddress, data) {
        try {
            const conditions = { groupId: groupId, userId: userId };

            const existingCustomer = await CustomerModel.find(conditions);

            if (!existingCustomer) {
                return new ServiceResponse({
                    isError: true,
                    message: 'Customer not found',
                });
            }

            if (newAddress && newAddress.address.default === true) {
                await CustomerModel.updateMany(conditions, { $set: { 'addresses.$[].address.default': false } });
            }

            if (newAddress && newAddress.address.billingAddress === true) {
                await CustomerModel.updateMany(conditions, { $set: { 'addresses.$[].address.billingAddress': false } });
            }

            if (newAddress && newAddress.address.shippingAddress === true) {
                await CustomerModel.updateMany(conditions, { $set: { 'addresses.$[].address.shippingAddress': false } });
            }

            if (newAddress) {
                if (newAddress.address.default === true) {
                    await CustomerModel.updateMany(conditions, { $set: { 'addresses.$[elem].address.default': false } }, { arrayFilters: [{ 'elem.address.default': true }] });
                }

                await CustomerModel.updateMany(conditions, { $push: { addresses: newAddress } });
            }

            if (Object.keys(data).length > 0) {
                await CustomerModel.updateMany(conditions, { $set: data });
            }

            const updatedCustomers = await CustomerModel.find(conditions);

            return new ServiceResponse({
                data: updatedCustomers,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }


    async updateAccountDetailsByUserId(userId, newAccountDetails, data) {
        try {
            const conditions = { userId: userId };
            const existingCustomer = await CustomerModel.findOne(conditions);

            if (!existingCustomer) {
                console.log("Customer not found for userId:", userId);
                return new ServiceResponse({
                    isError: true,
                    message: 'Customer not found',
                });
            }

            console.log("Existing Customer:", existingCustomer);

            if (
                newAccountDetails &&
                existingCustomer.accountDetails &&
                existingCustomer.accountDetails.length > 0
            ) {
                const existingAccountDetails = existingCustomer.accountDetails[0].accountDetails;

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
                existingCustomer.accountDetails.push(newAccountDetails);
            }

            if (Object.keys(data).length > 0) {
                for (const field in data) {
                    existingCustomer[field] = data[field];
                }
            }

            const updatedCustomer = await existingCustomer.save();

            console.log("Updated Customer:", updatedCustomer);

            return new ServiceResponse({
                data: updatedCustomer,
            });
        } catch (error) {
            console.error("Error in updateAccountDetailsByUserId:", error.message);
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    async deleteAccountDetails(groupId, userId, accountId) {
        try {
            const conditions = { groupId: groupId, userId: userId };
            const existingCustomer = await CustomerModel.findOne(conditions);

            if (!existingCustomer) {
                return new ServiceResponse({
                    isError: true,
                    message: 'Customer not found',
                });
            }

            const accountDetailsIndex = existingCustomer.accountDetails.findIndex(
                (details) => details.accountId === +accountId
            );

            if (accountDetailsIndex === -1) {
                return new ServiceResponse({
                    isError: true,
                    message: 'Account details not found',
                });
            }

            existingCustomer.accountDetails.splice(accountDetailsIndex, 1);

            const updatedCustomer = await existingCustomer.save();

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

    async listUpisByUserId(userId, groupId) {
        try {
            const conditions = { userId: userId, groupId: groupId };
            const existingCustomer = await CustomerModel.findOne(conditions);

            if (!existingCustomer) {
                return new ServiceResponse({
                    isError: true,
                    message: 'Customer not found',
                });
            }

            const upis = existingCustomer.accountDetails
                .filter((details) => details.accountDetails && details.accountDetails.upi)
                .map((details) => details.accountDetails.upi);

            return new ServiceResponse({
                data: upis,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    static async registerUser(userDto) {
        try {
            const response = await axios.post(
                process.env.AUTH_SERVICE_BASE_URL + "auth/user",
                userDto
            );
            return new ServiceResponse({
                // data: response.data,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.response
                    ? error.response.data.messages
                        ? error.response.data.messages
                        : error.response.data.message
                    : error.message,
            });
        }
    }

    async updateAddress(groupId, userId, addressId, newAddress) {
        try {
            const customer = await CustomerModel.findOne({ groupId, userId });

            if (!customer) {
                throw new Error("Customer not found");
            }

            const addressIndex = customer.addresses.findIndex((address) => address.addressId == addressId);

            if (addressIndex === -1) {
                throw new Error("Address not found");
            }

            if (newAddress.billingAddress) {
                customer.addresses.forEach((address) => {
                    address.address.billingAddress = false;
                });
                customer.addresses[addressIndex].address.billingAddress = true;
            }

            if (newAddress.shippingAddress) {
                customer.addresses.forEach((address) => {
                    address.address.shippingAddress = false;
                });
                customer.addresses[addressIndex].address.shippingAddress = true;
            }

            if (newAddress.default) {
                customer.addresses.forEach((address, index) => {
                    address.address.default = index === addressIndex;
                });
            }

            customer.addresses[addressIndex].address = { ...customer.addresses[addressIndex].address, ...newAddress };

            const updatedCustomer = await CustomerModel.findOneAndUpdate(
                { groupId, userId },
                { $set: { addresses: customer.addresses } },
                { new: true }
            );

            if (!updatedCustomer) {
                throw new Error("Failed to update customer");
            }

            return updatedCustomer;
        } catch (error) {
            throw error;
        }
    }

    async getDefaultAddress(groupId, userId) {
        try {
            const customer = await CustomerModel.findOne({ groupId, userId });

            if (!customer) {
                return new ServiceResponse({
                    message: "Customer not found",
                    data: {},
                    isError: true
                });
            }

            const defaultAddress = customer.addresses.find((address) => address.address.default === true);

            if (!defaultAddress) {
                return new ServiceResponse({
                    data: {},
                    message: "Default address not found",
                    isError: true,
                });
            }

            return new ServiceResponse({
                data: defaultAddress,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    async updateMembership(groupId, userId, membershipId, updateData) {
        try {
            const customer = await CustomerModel.findOne({ groupId, userId });

            if (!customer) {
                return new ServiceResponse({
                    message: "Customer not found",
                    isError: true,
                });
            }

            const membershipToUpdate = customer.memberMembership.find(member => member.membershipId == membershipId);

            if (!membershipToUpdate) {
                return new ServiceResponse({
                    message: "Membership not found for the given ID",
                    isError: true,
                });
            }

            Object.assign(membershipToUpdate, updateData);

            await customer.save();

            return new ServiceResponse({
                message: "Membership updated successfully",
                data: membershipToUpdate,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }

    async getAddress(groupId, userId) {
        try {
            const customer = await CustomerModel.findOne({ groupId, userId });

            if (!customer) {
                throw new Error("Customer not found");
            }

            const addresses = customer.addresses;

            if (!addresses || addresses.length === 0) {
                throw new Error("Addresses not found");
            }

            return { success: true, data: addresses };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteCustByIds(groupId, userId) {
        try {
            const result = await CustomerModel.deleteMany({ groupId: groupId, userId: { $in: userId } });
            return result;
        } catch (error) {
            console.error(error);
            throw { status: 500, error: 'Internal Server Error' };
        }
    }

    async getcustomerByGroupIdAndRoleId(groupId, roleId) {
        try {
            const customer = await CustomerModel.findOne({ groupId, roleId });

            return customer;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new CustomerService(CustomerModel, "customer");
