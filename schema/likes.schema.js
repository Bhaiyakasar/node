const mongoose = require("mongoose");

const LikesSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        likes: {
            type: Boolean,
            required: true,
        },
        userId: {
            type: Number,
            required: true
        },
        postId: {
            type: Number,
            required: true
        }
    },
    { strict: false, timestamps: true }
);
const LikesModel = mongoose.model("likes", LikesSchema);
module.exports = LikesModel;
