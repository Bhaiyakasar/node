const mongoose = require("mongoose");

const ServiceresponseSchema = new mongoose.Schema(
    {
        servicerequestId: {
            type: Number,
            required: false,
        },
        handledById:{
            type: Number
        },
        groupId: {
            type: Number,
            required: false,
        },
        comments: {
            type: String,
            required: false,
        },
        oldStatus: {
            type: String,
            required: false
        },
        newStatus: {
            type: String,
            required: false
        },
        targetEndDate: {
            type: String,
            required: false
        },
        handledBy: {
            type: String,
            required: false
        }
    },
    { strict: false, timestamps: true }
);

const ServiceresponseModel = mongoose.model("serviceresponse", ServiceresponseSchema);
module.exports = ServiceresponseModel;
