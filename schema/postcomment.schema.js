const mongoose = require("mongoose");

const PostCommentSchema = new mongoose.Schema(
    {},
    { strict: false, timestamps: true }
);

const PostCommentModel = mongoose.model("postcomment", PostCommentSchema);
module.exports = PostCommentModel;
