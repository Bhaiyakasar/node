const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/likes.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/likes.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const serviceResponse = await service.create(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);

router.post(
    "/like",
    checkSchema(require("../dto/likes.dto")),
    async (req, res) => {
        try {
           
            const { groupId, userId,postId ,likes} = req.body;
            const result = await service.postLikesData(groupId, userId, postId,likes);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get("/getLikesCount", async (req, res) => {
    const serviceResponse = await service.getAllLikes();
    res.json({
        success: 'Get Count successfully',
        count: serviceResponse
    });
});

router.get('/:postId', async (req, res) => {
    try {
        const getByPostId = await service.getByPostId(req.params.postId);
        res.json({
            message: "fetched successfully",
            postLikes: getByPostId
        });
    } catch (error) {
        console.log(error);
        throw err;
    }
});

router.get('/all/counts/:postId', async (req, res) => {
    try {
        const getByPostId = await service.getUniqueInfoPostId(req.params.postId);
        res.json({
            message: "fetched successfully",
            postId: getByPostId.postId,
            postLikes: getByPostId.countOfLike
        });
    } catch (error) {
        console.log(error);
        throw err;
    }
});

router.delete('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const serviceResponse = await service.deleteByuserId(userId);
        if (serviceResponse) {
            requestResponsehelper.sendResponse(res, serviceResponse);
        } else {
            res.json({
                data: 'data not available'
            });
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
});

router.delete; ("/:id", async (req, res) => {
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

router.get("/all/likes", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});
    requestResponsehelper.sendResponse(res, serviceResponse);
});

module.exports = router;
