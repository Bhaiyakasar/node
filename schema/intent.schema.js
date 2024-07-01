const mongoose = require("mongoose");

const IntentSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        intentId: {
            type: Number,
            required: true
        },
        products: {
            type: Array,
            required: true
        },
        intentDate: {
            type: Date,
            required: true
        },
        expecteDeliveryDate: {
            type: Date,
            required: true
        },
        warehouseId: {
            type: Number,
            required: true
        },
        suppliers: {
            type: [Number],
            required: true
        },
        quotationCount: {
            type: Number,
            required: false,
            default: 0
        }
    },
    { strict: false, timestamps: true }
);

const IntentModel = mongoose.model("intent", IntentSchema);
module.exports = IntentModel;