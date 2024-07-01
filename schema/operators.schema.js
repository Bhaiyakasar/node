const mongoose = require("mongoose");

const OperatorsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false
        },
        department: {
            type: String,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        groupId: {
            type: Number,
            required: false,
        },
        roleId: {
            type: Number,
            required: false,
        },
        phoneNumber: {
            type: Number,
            required: false,
        },
        empId: {
            type: Number,
            required: false,
        },
        managerId: {
            type: Number,
            required: false,
        },
        userId: {
            type: Number,
            required: false,
        },
        RFID: {
            type: String,
            required: false,
        },

        membership: {
            type: Array,
            required: false
        },
        accountDetails: {
            type: Array,
            required: false
        },
        experiences: {
            type: Array,
            required: false
        },
        operatorId: {
            type: Number,
            required: false
        }

    },
    { strict: false, timestamps: true }

);

const OperatorsModel = mongoose.model("operators", OperatorsSchema);
module.exports = OperatorsModel;
