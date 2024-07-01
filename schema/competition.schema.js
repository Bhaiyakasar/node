const mongoose = require("mongoose");

const CompetitionSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
    },
    { strict: false, timestamps: true }
);

const CompetitionModel = mongoose.model("competition", CompetitionSchema);
module.exports = CompetitionModel;
