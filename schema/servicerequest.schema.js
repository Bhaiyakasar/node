const mongoose = require("mongoose");

const ServicerequestSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: Number,
            required: true,
        },
        categoryId: {
            type: Number
        },
        subcategoryId: {
            type: Number
        },
        servicerequestId: {
            type: Number
        },
        location: {
            type: {
                type: String,
                default: 'Point'
            },
            coordinates: [Number]
        },
        name: {
            type: String,
            required: true,
        },
        userId: {
            type: Number,
            required: false,
        },
        groupId: {
            type: Number
        },
        status: {
            type: String,
            enum: ["new", "inprogress", "dispatched", "intransite", "delivered", "completed", "close", "return", "archive"],
            default: "new",
        },
        serviceResponsesCount: {
            type: Number,
            default: 0
        },
        handledById: {
            type: Number,
            default: 0
        },
        businessId: {
            type: Number
        },
        locationName: {
            type: String
        },
        locationPin: {
            type: Number
        },
        orderId: {
            type: Number
        },
        assignedTo: {
            type: String
        }
    },
    { strict: false, timestamps: true }
);

ServicerequestSchema.index({ groupId: 1, status: 1, name: "text", userId: 1, phoneNumber: 1, servicerequestId: 1, year: 1, month: 1, categoryId: 1, search: "text" });
ServicerequestSchema.plugin(require("mongoose-autopopulate"));
const ServicerequestModel = mongoose.model("servicerequest", ServicerequestSchema);
module.exports = ServicerequestModel;
