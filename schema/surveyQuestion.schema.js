const mongoose = require("mongoose");
const surveyQuestionSchema = new mongoose.Schema(
    {
        groupId:{
            type:Number,
            require:true,
        },
        questionId:{
            type:Number,
            require:true
        },
        index:{
            type:Number
        },
        question:{
            type:String
        },
       type:{
        type:String,
        enum:["text","radio","checkbox"]
       },
       options:[
        {
            name:String,
            value:Number
        }
       ]


    },
    { strict: false, timestamps: true}
);
const surveyQuestionModel = mongoose.model("surveyQuestion", surveyQuestionSchema);
module.exports = surveyQuestionModel;
