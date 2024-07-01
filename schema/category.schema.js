const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
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
            type: Number,
            required: false,
        },
        slug: {
            type: String,
            required: true,
        },
        tags: {
            type: Array,
            required: true,
        },
        isBusinessEnable: {
            type: Boolean,
            default: false
        },
        subGroupId: {
            type: Number
        },
        isCommerceEnable: {
            type: Boolean,
            default: false
        }
    },
    { strict: false, timestamps: true }
);

CategorySchema.plugin(require("mongoose-autopopulate"));
const CategoryModel = mongoose.model("category", CategorySchema);
module.exports = CategoryModel;
