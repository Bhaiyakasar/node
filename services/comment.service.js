const CommentModel = require("../schema/comment.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
class CommentService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getCommentsByPostId(postId) {
        try{
         const allComment=await CommentModel.find({postId:postId})
         if(!allComment){
             return new ServiceResponse({
                 message:"comment not found ",
                 isError:false
             })
         }
         return allComment
        }catch(error){
         return new ServiceResponse({
             message: error.message,
             isError: true
         });
        }
     }
}

module.exports = new CommentService(CommentModel, 'comment');
