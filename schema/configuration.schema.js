const mongoose = require("mongoose");

const ConfigurationSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        configurationId: {
            type: Number,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        appId: {
            type: Number,
            required: false
        },
       
    },
    { strict: false, timestamps: true }
);

const ConfigurationModel = mongoose.model("configuration", ConfigurationSchema);
module.exports = ConfigurationModel;
