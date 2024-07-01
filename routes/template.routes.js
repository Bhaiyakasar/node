const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/template.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/template.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const templateId = +Date.now()
        req.body.templateId = templateId
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

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/template", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/groupId/:groupId", async (req, res) => {
    const { groupId} = req.params;
    const { page, pageSize, templateId } = req.query;

    try {
        let template = await service.getTemplateById(groupId, templateId, page, pageSize);

        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/groupId/:groupId/templateId/:templateId", async (req, res) => {
    const { groupId, templateId } = req.params;
    const newData = req.body;
    let template = await service.updateTemplateById(groupId, templateId, newData)
    res.json(template)
})

router.delete("/groupId/:groupId/templateId/:templateId", async (req, res) => {
    const { groupId, templateId } = req.params;

    let template = await service.deleteTemplateById(groupId, templateId)
    res.json(template)
})



module.exports = router;
