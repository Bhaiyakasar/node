const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { checkSchema } = require("express-validator");
const service = require("../services/event.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/event.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const eventId = +Date.now();
        req.body.eventId = eventId;
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

router.get("/all/Event", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/getByEventId/:groupId", async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const serviceResponse = await service.getByEventId(req.params.groupId);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const criteria = {
            name: req.query.name,
            isEventActive: req.query.isEventActive,
            eventId: req.query.eventId
        };

        const serviceResponse = await service.getAllDataByGroupId(groupId, criteria);
        requestResponsehelper.sendResponse(res, serviceResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/feedback/:groupId/:eventId",
    [
        check("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
        check("comment").optional().isString().withMessage("Comment must be a string"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { groupId, eventId } = req.params;
            const { rating, comment, userId } = req.body;

            const event = await service.getByGroupIdAndEventId(groupId, eventId);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }

            event.feedback = event.feedback || [];

            const userFeedback = event.feedback.find(feedback => feedback.userId === userId && feedback.eventId === eventId);
            if (userFeedback) {
                return res.status(400).json({ error: "User has already provided feedback for this event" });
            }

            event.feedback.push({ rating, comment, userId });

            const serviceResponse = await service.addFeedback(groupId, eventId, { rating, comment, userId });

            requestResponsehelper.sendResponse(res, serviceResponse);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.delete("/feedback/:groupId/:eventId/:userId", async (req, res) => {
    try {
        const { groupId, eventId, userId } = req.params;

        const event = await service.getByGroupIdAndEventId(groupId, eventId);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Find the index of the feedback in the array based on userId
        const feedbackIndex = event.feedback.findIndex(f => f.userId === userId);

        // Check if the feedback exists
        if (feedbackIndex === -1) {
            return res.status(404).json({ error: "Feedback not found" });
        }

        // Remove the feedback from the array
        event.feedback.splice(feedbackIndex, 1);

        // Save the updated event
        const updatedEvent = await service.updateById(eventId, { feedback: event.feedback });

        requestResponsehelper.sendResponse(res, updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
