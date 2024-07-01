const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        phoneNumber: {
            type: Number,
            required: true,
        },
        custId: {
            type: Number,
            required: true,
        },
        userId: {
            type: Number,
            required: false
        },
        accountDetails: {
            type: Array
        },
        orderCount: {
            type: Number,
            required: false
        },
        serviceCount: {
            type: Number,
            required: false
        },
        addresses: {
            type: Array
        }
    },
    { strict: false, timestamps: true }
);
CustomerSchema.plugin(require("mongoose-autopopulate"));
const CustomerModel = mongoose.model("customer", CustomerSchema);
module.exports = CustomerModel;
