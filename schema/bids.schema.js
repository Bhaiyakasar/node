const mongoose = require("mongoose");

const BidsSchema = new mongoose.Schema(
    {
       
        groupId: {
            type: Number,
            required: false,
        },
        userId: {
            type: Number,
            required: false
        },
        addresses: {
            type: Array
        },
        originalprice: {
            type : Number,
            required: false,
        },
        bidprice: {
            type: Number,
            required: false,
        },
        postId:{
            type: Number,
            required: false,
        },
        description:{
            type:String,
            required: false
        }
    },
    { timestamps: true }
);

const BidsModel = mongoose.model("bids", BidsSchema);
module.exports = BidsModel;
