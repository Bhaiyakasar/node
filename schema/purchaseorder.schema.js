const mongoose = require("mongoose");

const PurchaseOrderSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        purchaseOrderId: {
            type: String,
            required: false
        },
        purchaseOrderDate: {
            type: Date,
            required: true
        },
        quotation: {
            type: Number,
            required: true
        }
    },
    { strict: false, timestamps: true }
);

const PurchaseOrderModel = mongoose.model("purchaseorder", PurchaseOrderSchema);
module.exports = PurchaseOrderModel;
