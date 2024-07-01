const mongoose = require("mongoose");
const SupplierSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        supplierId:{
            type: Number,
            required:false
        },
        accountDetails: {
            type: Array
        },
    },
    { strict:false,timestamps: true }
);
const SupplierModel = mongoose.model("supplier", SupplierSchema);
module.exports = SupplierModel;
