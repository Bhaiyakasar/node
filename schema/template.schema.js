const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        templateId: {
            type: Number,
            required: true
        },
        photo:{
            type:String,
            required:false
        },
        message:{
            type:String,
            required:false
        }
    },
    { strict: false, timestamps: true }
);

const TemplateModel = mongoose.model("template", TemplateSchema);
module.exports = TemplateModel;
