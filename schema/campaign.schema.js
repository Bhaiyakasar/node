const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    campaignId: {
        type: Number,
        required: false
    },
    groupId: {
        type: Number,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    start_date: {
        type: Date,
        required: false
    },
    end_date: {
        type: Date,
        required: false
    },
    assignedTo: {
        type: String,
        required: false
    },
    totalLead: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    userId: {
        type: Number,
        required: false
    },
    empId: {
        type: Number,
        required: false
    },
    type: {
        type: String,
        required: false
    },
    Leads: {
        type: Array
    },
    templates: {
        type: Array
    },
    createdBy: {
        type: Number,
        required: false
    },
    updatedBy: {

        type: Number,
        required: false
    },
    specificTime: {
        type: String,
        required: false
    },
    timeOption: {
        type: String,
        required: false
    },
    endTime: {
        type: String,
        required: false
    },
    startTime: {
        type: String,
        required: false
    },
    totalLeadsCallTime: {
        type: String,
        required: false
    }
}, { strict: false, timestamps: true }

);

const CampaignModel = mongoose.model('Campaign', campaignSchema);

module.exports = CampaignModel;
