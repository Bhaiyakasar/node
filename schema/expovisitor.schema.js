const mongoose = require("mongoose");

const ExpoVisitorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        groupId: {
            type: Number,
            required: false,
        },
        expoVisitorId: {
            type: Number,
            required: false,
        },
        phoneNumber: {
            type: Number,
            required: false,
        },
        userId: {
            type: Number,
            required: false,
        },
        appId: {
            type: Number,
            required: false,
        },
    },
    { strict: false, timestamps: true }
);

const ExpoVisitorModel = mongoose.model("expovisitor", ExpoVisitorSchema);
module.exports = ExpoVisitorModel;
