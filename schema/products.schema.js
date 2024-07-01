const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        groupId: {
            type: Number,
            required: true,
        },
        categoryId: {
            type: Number
        },
        subcategoryId: {
            type: Number
        },
        subCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subcategory",
            autopopulate: true,
        },
        tags: {
            type: Array,
            required: true
        },
        productcode: {
            type: Number
        },
        model: {
            type: String
        },
        description: {
            type: String
        },
        serialNumber: {
            type: Number
        },
        isPaymentOffline: {
            type: Boolean,
            default: true
        },
        isPaymentOnline: {
            type: Boolean,
            default: true
        },
        gst: {
            type: Number,
            default: 0,
        },
        igst: {
            type: Number,
            default: 0,
        },
        cgst: {
            type: Number,
            default: 0,
        },
        sgst: {
            type: Number,
            default: 0,
        },
        hsnNo: {
            type: Number,
            required: true
        },
        characteristics:{
            type:Array,
            required:false
        },
        tax:{
            type:Number,
            required:true
        },
    },
    { strict: false, timestamps: true }
);

productsSchema.index({ tags: 1 });
productsSchema.plugin(require("mongoose-autopopulate"));
const ProductsModel = mongoose.model("products", productsSchema);

module.exports = ProductsModel;
