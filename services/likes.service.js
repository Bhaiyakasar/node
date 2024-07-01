const LikesModel = require("../schema/likes.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");

class LikesService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async postLikesData(groupId, userId, postId) {
        try {
            const existingLike = await LikesModel.findOne({ userId:userId,postId:postId });

            if (existingLike ) {
                const unlikePost = await LikesModel.findOneAndDelete({ userId,postId });
               unlikePost.likes=false
                return { unlikePost, message: 'Unliked successfully' };
            } else {
                const newLike = new LikesModel({ groupId, likes: true, userId, postId });
                const likePost = await newLike.save();
                return { likePost, message: 'Liked successfully' };
            }
        } catch (error) {
            console.error(error);
            return new ServiceResponse({
                message: "An error occurred while saving the record",
                isError: true
            });
        }
    }

    async getAllLikes() {
        try {
            const alllikes = await LikesModel.find();
            const countOflikes = await LikesModel.countDocuments();
            if (!alllikes && !countOflikes) {
                return new ServiceResponse({
                    message: 'likes not found',
                    isError: true
                });
            }
            return {
                alllikes,
                countOflikes
            };
        } catch (error) {
            return new ServiceResponse({
                message: "An error occurred while detecting the record",
                isError: true
            });
        }
    }

    async deleteByuserId(userId) {
        try {
            const deletelikes = await LikesModel.findOneAndDelete({ userId: userId });
            if (!deletelikes) {
                return new ServiceResponse({
                    message: "_id not found",
                    isError: true
                });
            }
            return new ServiceResponse({
                message: "Record deleted successfully",
                deletelikes,
                isError: false
            });
        } catch (error) {
            // Handle unexpected errors
            console.error("Error in deleteById:", error);
            return new ServiceResponse({
                message: "An error occurred while deleting the record",
                isError: true
            });
        }
    }

    async getUniqueInfoPostId(postId) {
        try {
            const getlikesToPost = await LikesModel.find({ postId: postId });
            const countOfLike = await LikesModel.countDocuments({ postId: postId });
            if (!getlikesToPost) {
                return new ServiceResponse({
                    message: 'not likes found post',
                    isError: true
                });
            }
            getlikesToPost.postId = postId
            return {
                postId,
                countOfLike
            }
        } catch (error) {
            console.log(error);
            return new ServiceResponse({
                message: error,
                isError: true
            });
        }
    }

    async getByPostId(postId) {
        try {
            const getlikesToPost = await LikesModel.find({ postId: postId });
            const countOfLike = await LikesModel.countDocuments({ postId: postId })
            if (!getlikesToPost) {
                return new ServiceResponse({
                    message: 'not likes found post',
                    isError: true
                });
            }
            return {
                getlikesToPost,
                countOfLike
            }
        } catch (error) {
            console.log(error);
            return new ServiceResponse({
                message: error,
                isError: true
            });
        }
    }
}
module.exports = new LikesService(LikesModel, 'likes');
