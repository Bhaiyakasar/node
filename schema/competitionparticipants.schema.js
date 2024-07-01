const mongoose = require("mongoose");

const CompetitionParticipantsSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "competition",
            autopopulate: true,
        },
    },
    { strict: false, timestamps: true }
);

CompetitionParticipantsSchema.plugin(require("mongoose-autopopulate"));
const CompetitionParticipantsModel = mongoose.model(
    "competitionparticipants",
    CompetitionParticipantsSchema
);
module.exports = CompetitionParticipantsModel;
