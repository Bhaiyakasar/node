const mongoose = require("mongoose");

const TrendSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        groupId: {
            type: Number
        },
        categoryId: {
            type: Number
        },
        subcategoryId: {
            type: Number
        },
        location: {
            type: {
                type: String,
                default: 'Point'
            },
            coordinates: [Number]
        },
        productcode: {

        },
        locationName: {
            type: String
        },
        locationPin: {
            type: Number
        }
    },
    { timestamps: true }
);

const TrendModel = mongoose.model("trend", TrendSchema);
module.exports = TrendModel;
