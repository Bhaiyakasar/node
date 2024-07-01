const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/userwidgets.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    '/',
    checkSchema(require("../dto/userwidgets.dto")),
    async (req, res, next) => {
        try {
            if (ValidationHelper.requestValidationErrors(req, res)) {
                return;
            }

            const serviceResponse = await service.createOrUpdateUserWidget(req.body);
            requestResponsehelper.sendResponse(res, serviceResponse);
        } catch (error) {
            console.error('Error creating/updating user widget:', error);
            res.status(500).json({ success: false, error: error.message });
        }
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

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/userwidgets", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { userwidgetId, userId, appId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;

        let userwidget = await service.getUserWidgets(groupId, userwidgetId, userId, appId, page, pageSize);
        res.json(userwidget);
    } catch (error) {
        console.error("Error in getUserWidgets API:", error); 
        res.status(500).send({ error: "An error occurred" });
    }
});

router.delete("/delete/:groupId/:userwidgetId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userwidgetId = req.params.userwidgetId;

        const result = await service.deleteUserWidget(groupId, userwidgetId);
        
        if (result.success) {
            res.json({ message: "UserWidget deleted successfully" });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).send({ error: "An error occurred" });
    }
});


module.exports = router;
