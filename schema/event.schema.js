const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: false
        },
        eventId: {
            type: Number
        },
        isEventActive: {
            type: Boolean,
            required: true
        },
        popular_competition: [
            {
                competitionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "competition",
                    autopopulate: true,
                },
            }
        ],
    },
    { strict: false, timestamps: true }
);
EventSchema.plugin(require("mongoose-autopopulate"));
const EventModel = mongoose.model("event", EventSchema);
module.exports = EventModel;
