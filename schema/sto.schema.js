const mongoose = require("mongoose");

const STOSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: false,
        },
        stoId: {
            type: Number,
            required: false
        },
        groupId: {
            type: Number,
            required: false
        },
        stoDate: {
            type: Number,
            required: false
        },
        products: [
            {
                productcode: Number,
                qty: Number
            }
        ],
        status: {
            type: String,
            required: false
        },
        wareHouseId:{
            type:Number,
            required:false
        },
        type: {
            type: String,
            required: false
        },
        Qty: {
            type: Number,
            required: false
        },
        prise: {
            type: Number,
            required: false
        }
    },
    { strict: false, timestamps: true }
);

const STOModel = mongoose.model("sto", STOSchema);
module.exports = STOModel;
