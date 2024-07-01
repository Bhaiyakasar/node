const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        sId: {
            type: Number,
            required: true,  
        },
        startDate: {
            type: Number,
            required: true
        },
        endDate: {
            type: Number,
            required: true
        },
        createdBy: {
            type: String,
            required: true
        },
        updatedBy: {
            type: String,
            required: true
        },
        updatedDate: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        accessLevel: {
            type: String,
            required: true
        },
        link: {
            type: String,
            required: true
        },
        attempted: {
            type:Number,
            required: true
        },
        tags: {
            type:Array, 
            required: true
        }
    },
    { timestamps: true }
);

const SurveyModel = mongoose.model("survey", SurveySchema);
module.exports = SurveyModel;
