const mongoose = require("mongoose");

const InventrySchema = new mongoose.Schema(
    {
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "warehouse",
            autopopulate: true,
        },
        wareHouseId:{
            type:Number,
            required:false
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            autopopulate: true,
        },
        productcode: {
            type: Number
        },
        groupId: {
            type: Number,
            required: true,
        },
        inventryId: {
            type: Number
        },
        deleted:{
            type:Boolean,
            default:false
        }

    },
    { strict: false, timestamps: true }
);
InventrySchema.plugin(require("mongoose-autopopulate"));
const InventryModel = mongoose.model("inventry", InventrySchema);
module.exports = InventryModel;
