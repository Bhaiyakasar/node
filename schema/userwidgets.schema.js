const mongoose = require("mongoose");

const UserwidgetsSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: false,
        },
        userId: {
            type: Number,
            required: false
        },
        appId: {
            type: Number,
            required: false
        },
        name: {
            type: String,
            required: false,
        },
        isDashboardVisible: {
            type: Boolean,
            required: false
        },
        userwidgetId: {
            type: Number,
            required: false
        },
        widget:{
            type:Object,
            required:false
        }
    },
    { strict: false, timestamps: true }
);

const UserwidgetsModel = mongoose.model("userwidgets", UserwidgetsSchema);
module.exports = UserwidgetsModel;
