const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/expovisitorcontacts.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post("/", checkSchema(require("../dto/expovisitorcontacts.dto")), async (req, res, next) => {
    try {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }

        const serviceResponse = await service.create(req.body);

        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(`Error during record creation: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/expoVisitorContacts", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getAllByGroupId/group/:groupId", async (req, res) => {
    const { groupId } = req.params;
    const { visitorUserId, shopkeeperUserId, pageNumber, pageSize } = req.query;

    const criteria = {
        groupId: groupId,
        visitorUserId: visitorUserId,
        shopkeeperUserId: shopkeeperUserId,
        page: parseInt(pageNumber) || 1,
        limit: parseInt(pageSize) || 10
    };

    const serviceResponse = await service.getAllByCriteria(criteria);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.delete("/group/:groupId/expoVisitorContactsId/:expoVisitorContactsId", async (req, res) => {
    const { groupId, expoVisitorContactsId } = req.params;

    let expoVisitorContacts = await service.deleteExpovisitoreContactsById(groupId, expoVisitorContactsId)

    res.json(expoVisitorContacts)
})

module.exports = router;
