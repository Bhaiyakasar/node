const mongoose = require("mongoose");

const DeliveryCodeSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        code:{
            type: Number,
            required: true,
        },
       
    },
    { strict:false,timestamps: true }
);

const DeliveryCodeModel = mongoose.model("deliverycode", DeliveryCodeSchema);
module.exports = DeliveryCodeModel;
