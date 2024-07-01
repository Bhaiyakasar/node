const { default: mongoose } = require("mongoose");
const CategoryModel = require("../schema/category.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class CategoryService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getAllDataByGroupId(groupId, criteria, search) {
        const query = {
            groupId: groupId,
        };

        if (criteria.name) query.name = new RegExp(criteria.name, "i");

        if (criteria.userId) query.userId = criteria.userId;

        if (criteria.categoryId) query.categoryId = criteria.categoryId;

        if (criteria.subGroupId) query.subGroupId = criteria.subGroupId;

        if (criteria.isCommerceEnable) query.isCommerceEnable = criteria.isCommerceEnable;

        if (criteria.isBusinessEnable) query.isBusinessEnable = criteria.isBusinessEnable;

        if (criteria.tags) {
            const tagList = criteria.tags.split(",");
            const regexTags = tagList.map(tag => new RegExp(tag.trim(), "i"));
            query.tags = { $in: regexTags };
        }

        if (search) {
            const tagsRegex = search.split(",").map(tag => new RegExp(tag.trim(), 'i'));
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { desc: { $regex: search, $options: 'i' } },
                { tags: { $elemMatch: { $in: tagsRegex } } }
            ];
        }

        return this.preparePaginationAndReturnData(query, criteria);
    }

    async saveProductInCart(details) {
        return this.execute(async () => {
            let createCategories = await this.model.findOne({
                groupId: details.groupId,
                userId: new mongoose.Types.ObjectId(details.userId),
            });
            if (!createCategories) {
                createCategories = await this.model.create({
                    groupId: details.groupId,
                    userId: new mongoose.Types.ObjectId(details.userId),
                    category: details.category,
                });
            } else {
                // Convert product IDs to ObjectIds
                const categoriesIds = details.category.map(
                    (categoryId) => new mongoose.Types.ObjectId(categoryId)
                );

                // Filter out duplicate product IDs before concatenating
                const uniqueCategoryIds = categoriesIds.filter(
                    (categoryId) => !createCategories.category.includes(categoryId)
                );

                createCategories.category =
                createCategories.category.concat(uniqueCategoryIds);
                await createCategories.save();
            }
            let category = await this.model.findOneAndUpdate(
                {
                    groupId: details.groupId,
                    userId: new mongoose.Types.ObjectId(details.userId),
                },
                {
                    $addToSet: {
                        category: {
                            $each: details.category.map(
                                (categoryId) =>
                                    new mongoose.Types.ObjectId(categoryId)
                            ),
                        },
                    },
                },
                { new: true }
            );

            return category;
        });
    }
    async bulkadd(record, appId) {
        return this.execute(() => {
            const queries = record.map(recordItem => { 
                const categoryId = +Date.now() + Math.floor(Math.random() * 1000);
                recordItem.categoryId = categoryId;
    
                return {
                    updateOne: {
                        filter: {
                            name: recordItem.name,
                            groupId: recordItem.groupId,
                            categoryId: recordItem.categoryId,
                            subcategory: recordItem.subcategory,
                            imageUrl: recordItem.imageUrl,
                            description: recordItem.description,
                            pictures: recordItem.pictures,
                            isBusinessEnable: recordItem.isBusinessEnable,
                            isCommerceEnable: recordItem.isCommerceEnable,
                        },
                        update: {
                            $set: { ...recordItem, appId: appId },
                        },
                        upsert: true,
                    },
                };
            });
    
            console.log(queries);
            return this.model.bulkWrite(queries);
        });
    }
    
   
    async getDataByCategoryId(categoryId){
        let categoryData=await CategoryModel.findOne({categoryId:categoryId})
        return categoryData
    }
}

module.exports = new CategoryService(CategoryModel, "category");
