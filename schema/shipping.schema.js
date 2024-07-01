const mongoose = require("mongoose");

const ShippingSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "order",
            autopopulate: true,
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "warehouse",
            autopopulate: true,
            required: false,
        },
        status: {
            type: String,
            enum: ["pending", "complete", "canceled"],
            default: "pending",
        },
        otp: {
            type: Number,
            default: 12345,
        },
        shippingId: {
            type: Number,
            required: false,
        },
        authorizedBy: [
            {
                empployeeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "employee",
                    autopopulate: true,
                },
            },
        ],
    },
    { strict: false, timestamps: true }
);
ShippingSchema.plugin(require("mongoose-autopopulate"));
const ShippingModel = mongoose.model("shipping", ShippingSchema);
module.exports = ShippingModel;
