const mongoose = require("mongoose");

const PaymenthistorySchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: false,
        },
        orderId: {
            type: Number,
            required: false,
        }
    },
    { strict: false, timestamps: true }
);

const PaymenthistoryModel = mongoose.model("paymenthistory", PaymenthistorySchema);
module.exports = PaymenthistoryModel;
