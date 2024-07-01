const mongoose = require("mongoose");

const ExpoVisitorContactsSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: false,
        },
        expoVisitorContactId: {
            type: Number,
            required: false,
        },
        visitorUserId: {
            type: Number,
            required: false,
        },
        shopkeeperUserId: {
            type: Number,
            required: false,
        }
    },
    { strict: false, timestamps: true }
);

const ExpoVisitorContactsModel = mongoose.model("expovisitorcontacts", ExpoVisitorContactsSchema);
module.exports = ExpoVisitorContactsModel;