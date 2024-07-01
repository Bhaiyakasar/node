const PostCommentModel = require("../schema/postcomment.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class PostCommentService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
}

module.exports = new PostCommentService(PostCommentModel, 'postcomment');
