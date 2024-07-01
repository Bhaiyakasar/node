const mongoose = require("mongoose");

const WidgetsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        widgetId: {
            type: Number,
            required: false
        },
        appId: {
            type: Number,
            required: false
        }
    },
    { strict: false, timestamps: true }
);

const WidgetsModel = mongoose.model("widgets", WidgetsSchema);
module.exports = WidgetsModel;
