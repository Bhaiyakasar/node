const mongoose = require("mongoose");

const surveyQuestionAnswerSchema = new mongoose.Schema(
    { 
        groupId:{
            type:Number,
            required:true
        },
        sId: {
            type: Number,
            required: true,

        },
        questionId: {
            type: Number,
            required: true
        },
        answer: {
            type: String,
            required: true
        }
    },
    { strict: false, timestamps: true }
);



surveyQuestionAnswerSchema.plugin(require("mongoose-autopopulate"));
const surveyQuestionAnswerModel = mongoose.model("surveyQuestionAnswer", surveyQuestionAnswerSchema);
module.exports = surveyQuestionAnswerModel;
