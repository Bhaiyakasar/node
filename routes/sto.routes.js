const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/sto.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/sto.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const stoId = +Date.now();
        req.body.stoId = stoId;
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

router.get("/all/STO", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const stoId = req.query.stoId;  
    try {
        const serviceResponse = await service.getAllDataByGroupId(groupId,stoId);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});


router.put("/group/:groupId/sto/:stoId", async (req, res) => {
    try {
        const questionId = req.params.stoId;
        const groupId = req.params.groupId;
        const newData = req.body;
        const updatesto =
            await service.updateStoById(
                questionId,
                groupId,
                newData
            );
        if (!updatesto) {
            res.status(404).json({
                error: "stodata data not found to update",
            });
        } else {
            res.status(200).json(updatesto);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
);

module.exports = router;
