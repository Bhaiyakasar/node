const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/customer.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const axios = require("axios");
const { default: mongoose } = require("mongoose");
const CustomerModel = require("../schema/customer.schema");

router.post("/", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const existingCustomer = await service.findByPhoneNumber(req.body.phoneNumber, req.body.groupId);

    if (existingCustomer) {
        return requestResponsehelper.sendResponse(res, { message: "Customer with the same phoneNumber already exists", data: existingCustomer });
    }

    const custId = +Date.now();

    req.body.custId = custId;

    if (!req.body.addresses || req.body.addresses.length === 0) {
        req.body.addresses = [];
    } else {
        req.body.addresses = req.body.addresses.map((addressData) => {
            const addressId = +Date.now();
            return {
                _id: new mongoose.Types.ObjectId(),
                addressId: addressId,
                address: addressData,
            };
        });
    }

    if (!req.body.accountDetails || req.body.accountDetails.length === 0) {
        req.body.accountDetails = [];
    } else {
        req.body.accountDetails = req.body.accountDetails.map((paymentDetailsData) => {
            const accountId = +Date.now();
            return {
                _id: new mongoose.Types.ObjectId(),
                accountId: accountId,
                accountDetails: paymentDetailsData,
            };
        });
    }

    const serviceResponse = await service.create(req.body);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getByCustomerByUserId/:userId", async (req, res, next) => {
    try {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const serviceResponse = await service.getByUserId(req.params.userId);
        if (!serviceResponse.data || serviceResponse.data.length === 0) {
            return res.status(404).json({ message: "Data not found", data: {} });
        }

        return res.status(200).json({ message: "Success", data: serviceResponse.data, totalItemsCount: serviceResponse.totalItemsCount, totalPages: serviceResponse.totalPages });
    } catch (error) {
        return res.status(500).json({ message: error.message, data: [] });
    }
});

router.delete("/deleteAddress/:groupId/:userId/:addressId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.params.userId;
        const addressId = req.params.addressId;

        const serviceResponse = await service.deleteAddressByGroupIdUserIdAddressId(groupId, userId, addressId);

        if (serviceResponse.isError) {
            return res.status(500).json({ error: serviceResponse.message });
        }

        return res.json({ message: "Address deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/updateByCustId/:custId", async (req, res) => {
    if (!req.body.addresses || req.body.addresses.length === 0) {
        // If no addresses are provided, assign an empty array to req.body.addresses
        req.body.addresses = [];
    } else {
        // Generate MongoDB ObjectId for each address if it doesn't have an _id already
        req.body.addresses = req.body.addresses.map((address) => {
            if (!address._id) {
                return {
                    _id: new mongoose.Types.ObjectId(),
                    address,
                };
            }
            return address;
        });
    }
    const serviceResponse = await service.updateCustomer(
        req.params.custId,
        req.body
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/updateByUserId/:groupId/:userId", async (req, res) => {
    try {
        const { groupId, userId } = req.params
        const data = {};
        const newAddress = req.body.addresses && req.body.addresses.length > 0
            ? {
                _id: new mongoose.Types.ObjectId(),
                addressId: +Date.now(),
                address: { ...req.body.addresses[0] }
            }
            : null;

        for (const key in req.body) {
            if (key !== 'addresses') {
                data[key] = req.body[key];
            }
        }

        const serviceResponse = await service.updateCustomerByUserId(groupId, userId, newAddress, data);

        if (serviceResponse.isError) {
            return res.status(500).json({ error: serviceResponse.message });
        }

        return res.json({ data: serviceResponse.data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.put("/accountDetails/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = {};

        const newAccountDetails = req.body.accountDetails && req.body.accountDetails.length > 0
            ? {
                _id: new mongoose.Types.ObjectId(),
                accountId: +Date.now(),
                accountDetails: { ...req.body.accountDetails[0] }
            }
            : null;

        for (const key in req.body) {
            if (key !== 'accountDetails') {
                data[key] = req.body[key];
            }
        }

        const serviceResponse = await service.updateAccountDetailsByUserId(userId, newAccountDetails, data);

        if (serviceResponse.isError) {
            return res.status(500).json({ message: serviceResponse.message, data: {} });
        }

        return res.json({ data: serviceResponse.data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete("/accountDetails/:groupId/:userId/:accountId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.params.userId;
        const accountId = req.params.accountId;

        const serviceResponse = await service.deleteAccountDetails(groupId, userId, accountId);

        if (serviceResponse.isError) {
            return res.status(500).json({ error: serviceResponse.message });
        }

        return res.json({ message: 'Account details deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/upis/:groupId/:userId", async (req, res) => {
    try {
        const { userId, groupId } = req.params;

        const serviceResponse = await service.listUpisByUserId(userId, groupId);

        if (serviceResponse.isError) {
            return res.status(500).json({ error: serviceResponse.message });
        }

        return res.json({ status: "Success", message: "Customer UPI list get successful.", data: serviceResponse.data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/customer", async (req, res) => {
    const serviceResponse = await service.getAllRequestsByCriteria({
        groupId: req.query.groupId,
        phoneNumber: req.query.phoneNumber,
    });

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/getBycustId/:custId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByCustId(req.params.custId);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const { name, phoneNumber, userId, search, location, source, page, limit } = req.query;
    const pageSize = parseInt(limit) || 10;
    const pageNumber = parseInt(page) || 1;
    const serviceResponse = await service.getAllDataByGroupId(groupId, name, phoneNumber, userId, search, location, source, pageNumber, pageSize);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/updateAddress/:groupId/:userId/:addressId", async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.params.userId;
    const addressId = req.params.addressId;

    if (!req.body.address) {
        return res.status(400).json({ message: "New address data is missing in the request body." });
    }

    try {
        const updatedCustomer = await service.updateAddress(groupId, userId, addressId, req.body.address);
        return res.status(200).json({
            message: "Address updated successfully",
            data: updatedCustomer,
        });
    } catch (error) {
        console.error("An error occurred while updating the address:", error);
        return res.status(500).json({ message: "An error occurred while updating the address." });
    }
});

router.get("/getDefaultAddress/:groupId/:userId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.params.userId;

        const serviceResponse = await service.getDefaultAddress(groupId, userId);
        if (serviceResponse.isError) {
            return res.status(500).json({ message: serviceResponse.message, data: serviceResponse.data });
        }

        return res.json({ message: serviceResponse.message, data: serviceResponse.data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/address/:groupId/:userId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.params.userId;

        const serviceResponse = await service.getAddress(groupId, userId);
        if (serviceResponse.success) {
            return res.json({ message: "Success", data: serviceResponse.data });
        } else {
            return res.status(500).json({ message: serviceResponse.error });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.put("/updateMembership/:groupId/:userId/:membershipId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.params.userId;
        const membershipId = req.params.membershipId;

        const updateData = req.body;

        const serviceResponse = await service.updateMembership(groupId, userId, membershipId, updateData);

        if (serviceResponse.isError) {
            return res.status(500).json({ error: serviceResponse.message });
        }

        return res.json({ message: "Membership updated successfully", data: serviceResponse.data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete('/groupId/:groupId', async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.query.userId.split(',');
    try {
        const result = await service.deleteCustByIds(groupId, userId);
        res.json(result);
        console.log(result);
    } catch (error) {
        const { status, error: errorMessage } = error;
        return res.status(status).json({ error: errorMessage });
    }
});

router.get('/get/customer/:groupId/:roleId', async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const roleId = parseInt(req.params.roleId);

    try {
        const customerData = await service.getcustomerByGroupIdAndRoleId(groupId, roleId);

        if (customerData) {
            res.status(200).json({ message: "data fetch successfully ", customerData });
        } else {
            res.status(404).json({ message: 'customer not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
