const mongoose = require("mongoose");

const WarehouseSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            autopopulate: true,
        },
        groupId: {
            type: Number,
            required: true,
        },
        wareHouseId: {
            type: Number,
            required: true,
        }
    },
    { strict: false, timestamps: true }
);

const WarehouseModel = mongoose.model("warehouse", WarehouseSchema);
module.exports = WarehouseModel;
