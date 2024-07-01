const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
    {
      
        groupId: {
            type: Number,
            required: true,
        },
        userId: {
            type: Number,
            required: false,
        },
        postId:{
            type: Number,
            required: false,
        },
        message: {
            type: String,
            required: false,
        }
    },
    { timestamps: true }
);

const CommentModel = mongoose.model("comment", CommentSchema);
module.exports = CommentModel;
