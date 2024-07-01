const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        groupId: {
            type: Number,
            required: true,
        },
        parentServiceId: {
            type: Number,
            required: false,
        },
        subcategoryId: {
            type: Number,
            required: false
        },
        CategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "category",
            autopopulate: true,
        },
        categoryId: {
            type: Number,
            required: false,
        },
        tags: {
            type: Array,
            required: false

        },
        location: {
            type: {
                type: String,
                default: 'Point'
            },
            coordinates: [Number]
        },
        featured: {
            type: Boolean,
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
    },
    { strict: false, timestamps: true }
);
ServiceSchema.index({ groupId: 1, name: 1, desc: 1, tags: 1 });
ServiceSchema.index({ location: "2dsphere" });
ServiceSchema.plugin(require("mongoose-autopopulate"));
const ServiceModel = mongoose.model("services", ServiceSchema);
module.exports = ServiceModel;
