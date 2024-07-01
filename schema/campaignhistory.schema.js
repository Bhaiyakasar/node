const { json } = require("body-parser");
const mongoose = require("mongoose");

const CampaignhistorySchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: false
        },
        campaignId: {
            type: Number,
            required: false
        },
        leadId: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        callDate: {
            type:String,
            required: false
        },
        followUpDate: {
            type: Date,
            required: false
        },
        recordText: {
            type: String,
            required: false
        },
        Time: {
            type: String,
            required: false
        },
        campaignhistoryId: {
            type: Number,
            default: Date.now
        },
        leadCallTime: {
            type: String,
            required: false
        }
    },
    { strict: false, timestamps: true }
);

const CampaignhistoryModel = mongoose.model("campaignhistory", CampaignhistorySchema);
module.exports = CampaignhistoryModel;