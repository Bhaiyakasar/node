const { strict } = require("assert");
const mongoose = require("mongoose");

const CallhistorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false,
        },
        mode: {
            type: String,
            required: false
        },
        date:{
            type:Date,
            require: false
        },
        location: {
            type: String,
            required: false,
        },
        terminalNo: {
            type: Number,
            required: false
        },
        contactNo: {
            type: Number,
            required: false
        },
        customerName: {
            type: String,
            required: false
        },
        duration: {
            type: Number,
            required: false
        },
        flag: {
            type: String,
            required: false
        }
    },
    { strict: false, timestamps: true }
);

const CallhistoryModel = mongoose.model("callhistory", CallhistorySchema);
module.exports = CallhistoryModel;
