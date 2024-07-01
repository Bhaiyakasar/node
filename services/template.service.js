const TemplateModel = require("../schema/template.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class TemplateService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getTemplateById(groupId, templateId, page = 1, pageSize = 10) {
        try {
            let query = {
                groupId: groupId
            };
    
            if (templateId) {
                query.templateId = templateId;
            }
    
            const skip = (page - 1) * pageSize;
    
            const [template, totalCount] = await Promise.all([
                TemplateModel
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize),
                TemplateModel.countDocuments(query)
            ]);
    
            const totalPages = Math.ceil(totalCount / pageSize);
    
            return {
                data: {
                    items: template,
                    totalCount: totalCount,
                    totalPages: totalPages,
                    currentPage: page,
                    pageSize: pageSize
                }
            };
        } catch (error) {
            console.error('Error fetching template:', error);
            throw new Error('Error fetching template: ' + error.message);
        }
    }

    async updateTemplateById(groupId, templateId, newData) {
        let template = await TemplateModel.findOneAndUpdate(
            { groupId: groupId, templateId: templateId },
            newData,
            { new: true }
        )
        return {
            data: {
                item: template
            }
        }
    }

    async deleteTemplateById(groupId,templateId){
        let template=await TemplateModel.findOneAndDelete({groupId:groupId,templateId:templateId})
        return {
            data:{
                item:template
            }
        }
    }

}

module.exports = new TemplateService(TemplateModel, 'template');
