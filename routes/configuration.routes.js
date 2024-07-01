const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/configuration.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/configuration.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        req.body.configurationId = +Date.now();
        const serviceResponse = await service.create(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);

function isValidDataType(dataType, leadStatus) {
    switch (dataType) {
        case "string":
            return typeof leadStatus === "string";
        case "number":
            return typeof leadStatus === "number";
        case "boolean":
            return typeof leadStatus === "boolean";
        case "array":
            return Array.isArray(leadStatus);
        default:
            return false;
    }
}

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

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { configurationId, appId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;

        let configuration = await service.getConfiguration(groupId, configurationId, appId, page, pageSize);
        res.json(configuration);
    } catch (error) {
        res.status(500).send({ error: "An error occurred" });
    }
});

router.get("/all/configuration", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/groupId/:groupId/configurationId/:configurationId", async (req, res) => {
    try {
        const { groupId, configurationId } = req.params

        let configuration = await service.updateConfiguration(groupId, configurationId, req.body)
        res.json(configuration)
    } catch (error) {
        res.status(500).send("Internal server error", error)
    }
})

router.delete("/delete/configuration", async (req, res) => {
    const { groupId, configurationIds } = req.body;
    try {
        const configuration = await service.deleteConfigurationById(groupId, configurationIds);
        if (!configuration) {
            return res.status(404).json({ message: "Data not found" });
        }
        res.status(200).json({ message: "Data deleted successfully", data: configuration })
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting data" });
    }
})

module.exports = router;
