const BuysellModel = require("../schema/buysell.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const CustomerModel = require('../schema/customer.schema')
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");


class BuysellService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }


    async saveproduct(topic) {
        try {
            const product = await BuysellModel.create(topic);
            if (!product) {
                return new ServiceResponse({
                    message: "product not saved",
                    isError: true,
                });
            }
            return product
        } catch (err) {
            throw err;
        }
    }

    async getBypostId(postId) {
        return this.execute(() => {
            return this.model.findOne({ postId: postId });
        });


    }

    async  findKey(key) {
        try {
            let query = {};
            if (key) {
                const regex = { $regex: key, $options: 'i' };
                const orConditions = [
                    { category: regex },
                    { subCategory: regex },
                    { productName: regex },
                    { description: regex },
                    { model: regex },
                ];
    
               
                const numericValue = Number(key);
                if (!isNaN(numericValue)) {
                    orConditions.push(
                        { quantity: numericValue },
                        { sellingPrice: numericValue }
                    );
                }
    
                query.$or = orConditions;
            }
    
            const data = await BuysellModel.find(query);
            return data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    

    async updatePost(postId, data) {
        try {
            const resp = await BuysellModel.findOneAndUpdate(
                { postId: postId },

                data,
                { upsert: true, new: true }
            );

            return new ServiceResponse({
                data: resp,
            });
        } catch (error) {
            return new ServiceResponse({
                isError: true,
                message: error.message,
            });
        }
    }


    async updateproduct(postId, topic) {
        try {
            const condition = { postId: postId }


            const updateProduct = await BuysellModel.findOneAndUpdate(condition, topic, { new: true })
            console.log(updateProduct)
            if (!updateProduct) {
                return new ServiceResponse({
                    message: "product not update",
                    isError: true,
                });
            }
            return updateProduct
        } catch (err) {
            throw err;
        }
    }

    async getAllUser() {
        try {
            const getUser = await BuysellModel.find();
            if (!getUser) {
                return new ServiceResponse({
                    message: "product not found",
                    isError: true,
                });
            }
            return getUser
        } catch (err) {
            throw err;
        }
    }

    async getDetailsByPostId(postId) {
        try {
            const saleProduct = await BuysellModel.findOne({ postId: postId });
            console.log(saleProduct)
            if (!saleProduct) {
                return new ServiceResponse({
                    status: 'Failed',
                    message: 'Saleproduct not found',
                    isError: true,
                });
            }
            const userId = saleProduct.userId;
            const customer = await CustomerModel.findOne({ userId: userId }).populate('userId');
            if (!customer) {
                return new ServiceResponse({
                    status: 'Failed',
                    message: 'Customer not found',
                    isError: true,
                });
            }

            const filterCustomer = {
                name: customer.fullname,
                groupId: customer.groupId,
                name: customer.name,
                custId: customer.custId,
                userId: customer.userId,
                addresses: customer.addresses,
                // imageUrl:customer.imageUrl,
                // accountDetails:customer.accountDetails,
            }
            return { filterCustomer, saleProduct }
        } catch (err) {
            throw err;
        }
    }


    async getCustomer(custId) {
        try {
            const getCustomer = await BuysellModel.findOne({ custId: custId });
            if (!getCustomer) {
                return new ServiceResponse({
                    message: 'customer not get',
                    isError: true
                })
            }
            return getCustomer
        } catch (err) {
            throw err;
        }
    }

    async deletePostByPostId(postId) {
        try {
            const deletePost = await BuysellModel.findOneAndDelete({ postId: postId })
            return deletePost

        } catch (error) {
            const { status, error: errorMessage } = error;
            return res.status(status).json({ error: errorMessage });
        }
    }

    async getProductByCateoryId(categoryId) {
        try {
            const productFetch = await BuysellModel.find({ categoryId: { $in: categoryId } });

            if (!productFetch.length) {
                return new ServiceResponse({
                    message: 'no product found',
                    isError: false
                });
            }

            const customerIds = productFetch.map(product => product.userId);

            const findUser = await CustomerModel.find({ userId: { $in: customerIds } });
            const items = [];

            for (const user of findUser) {
                const userProducts = productFetch.filter(product => product.userId === user.userId);

                for (const product of userProducts) {
                    items.push({
                        ...product.toObject(),
                        user: user,
                        // tags: product.tags.map(tag => tag.toString())
                    });
                }
            }

            return items;
        } catch (err) {
            return new ServiceResponse({
                message: err.message,
                isError: true
            });
        }
    }

}


module.exports = new BuysellService(BuysellModel, 'buysell');
