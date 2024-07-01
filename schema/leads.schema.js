const mongoose = require("mongoose");

const LeadsSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        userId: {
            type: Number,
            required: false,
        },
        leadId: {
            type: Number,
            required: true
        },
        phoneNumber: {
            type: Number,
            required: false
        },
        name: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false,
        },
        type: {
            type: String,
            required: false,
        },
        dept: {
            type: String,
            required: false,
        },
        date: {
            type: String,
            required: false
        },
        source: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ["negative", "positive", "new", "direct", "neutral", "won", "lost", "counselling", "counselling done"],
            default: "new"
        },
        tag: [
            {
                type: String,
                required: false
            }
        ],
        followUpDate: {
            type: String,
            required: false
        },
        assignedTo: {
            type: Object,
            required: false
        },
        isHandled: {
            type: Boolean,
            default: false
        }
    },
    { strict: false, timestamps: true }
);

const LeadsModel = mongoose.model("leads", LeadsSchema);
module.exports = LeadsModel;
