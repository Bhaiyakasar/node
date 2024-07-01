const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/supplier.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const { default: mongoose } = require("mongoose");

router.post(
    "/",
    checkSchema(require("../dto/supplier.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
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
        const supplierId = +Date.now();
        req.body.supplierId = supplierId;
        const serviceResponse = await service.create(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/updateSupplier/:supplierId", async (req, res) => {
    if (!req.body.addresses || req.body.addresses.length === 0) {

    } else {

        req.body.addresses = req.body.addresses.map((address) => {
            if (!address._id) {
                return {
                    _id: new mongoose.Types.ObjectId(),
                    ...address,
                };
            }
            return address;
        });
    }
    const serviceResponse = await service.updateSupplierBySupplierId(req.params.supplierId, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/updateBySupplierId/:supplierId", async (req, res) => {
    const serviceResponse = await service.updateShipping(
        req.params.supplierId,
        req.body
    );

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/supplier", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        name: req.query.name,
        supplierId: req.query.supplierId
    };

    const serviceResponse = await service.getAllDataByGroupId(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/accountDetails/:supplierId", async (req, res) => {
    try {
        const supplierId = req.params.supplierId;
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

        const serviceResponse = await service.updateAccountDetailsByUserId(supplierId, newAccountDetails, data);

        if (serviceResponse.isError) {
            return res.status(500).json({ message: serviceResponse.message, data: {} });
        }

        return res.json({ message: "Supplier's account details have been updated successfully.", data: serviceResponse.data });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


module.exports = router;
