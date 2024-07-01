const mongoose = require("mongoose");

const ServiceActionSchema = new mongoose.Schema(
    {
       groupId:{
        type:Number,
        required:false
       },
     
    },
    {strict:false, timestamps: true }
);

const ServiceActionModel = mongoose.model("serviceaction", ServiceActionSchema);
module.exports = ServiceActionModel;
