const mongoose = require("mongoose");

const BussinessSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            require: false
        },
        categoryId: {
            type: Number,
            required: false
        },
        name: {
            type: String,
            required: false
        },
        tag: {
            type: String,
            required: false
        },
        location: {
            type: {
                type: String,
                default: 'Point'
            },
            coordinates: [Number]
        },
        subGroupId: {
            type: Number
        },
        featured: {
            type: Boolean,
            default: false
        },
        businessId: {
            type: Number,
            default: false
        },
        promotion: {
            type: Boolean,
            default: false
        },
        sponsored: {
            type: Boolean,
            default: false
        },
        isProduct: {
            type: Boolean,
            default: false
        }
    },
    { strict: false, timestamps: true }
);

BussinessSchema.index({ location: "2dsphere" });
const BussinessModel = mongoose.model("bussiness", BussinessSchema);
module.exports = BussinessModel;
