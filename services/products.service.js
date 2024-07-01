const { default: mongoose } = require("mongoose");
const ProductsModel = require("../schema/products.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const InventryModel = require("../schema/inventry.schema");

class ProductsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    
    async getByProductCode(productcode, groupId) {
        try {
            const inventoryData = await InventryModel.findOne({ productcode: productcode, groupId: groupId })
                .sort({ _id: -1 })
                .limit(1);
    
            if (!inventoryData) {
                throw new Error("Inventory data not found");
            }
    
            const updateResult = await ProductsModel.updateMany(
                { productcode: productcode, groupId: groupId },
                {
                    buyingPrice: inventoryData.buyingPrice,
                    memberPrice: inventoryData.memberPrice,
                    regularPrice: inventoryData.regularPrice,
                    marketPrice: inventoryData.marketPrice
                }
            );
    
            if (updateResult.nModified === 0) {
                throw new Error("No products updated");
            }
    
            return updateResult;
        } catch (error) {
            throw error;
        }
    }
    //search prodcut by price
    async processProductSearch(groupId, criteria) {
        const minPrice = parseFloat(criteria.minPrice);
        const maxPrice = parseFloat(criteria.maxPrice);
        const name = criteria.name;

        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
            const priceQuery = {
                groupId: groupId,
                memberPrice: { $gte: minPrice, $lte: maxPrice },
            };
            if (name) priceQuery.name = new RegExp(criteria.name, "i");

            try {
                const filteredProducts = await ProductsModel.find(priceQuery);
                const response = {
                    data: filteredProducts,
                };
                return response;
            } catch (error) {
                throw new Error("Error while fetching products");
            }
        } else {
            const groupQuery = {
                groupId: groupId,
            };
            if (criteria.serialNumber)
                groupQuery.categoryId = criteria.categoryId;
            if (criteria.name) groupQuery.name = new RegExp(criteria.name, "i");
            if (criteria.slug) groupQuery.slug = new RegExp(criteria.slug, "i");
            if (criteria.memberPrice)
                groupQuery.memberPrice = new RegExp(criteria.memberPrice, "i");
            if (criteria.productcode)
                groupQuery.productcode = criteria.productcode;

            return this.preparePaginationAndReturnData(groupQuery, criteria);
        }
    }

    async searchQuery(groupId, searchQuery) {
        const searchData = await this.execute(() => {
            const query = {
                groupId: groupId,
                $or: [
                    {
                        tags: {
                            $in: [!isNaN(searchQuery) ? parseFloat(searchQuery) : null]
                        }
                    },

                    { categoryId: !isNaN(searchQuery) ? searchQuery : null },
                    { memberPrice: !isNaN(searchQuery) ? searchQuery : null },
                    { name: !isNaN(searchQuery) ? searchQuery : null },
                    { slug: searchQuery.toString() },
                    { productcode: !isNaN(searchQuery) ? searchQuery : null },
                ],
            };
            return ProductsModel.find(query);
        });

        return searchData;
    }

    // async getAllSponseredProduct(groupId,criteria) {
    //     const pagination = {
    //         pageNumber: criteria.pageNumber,
    //         pageSize: criteria.pageSize,
    //     };
    //     const paginationErrors =
    //         this.validateAndSanitizePaginationProps(pagination);
    //     if (paginationErrors) {
    //         return paginationErrors;
    //     }
    //     const query = {groupId:groupId, sponsored: true };
    //     if (criteria.sponsored) {
    //         query.sponsored = criteria.sponsored;
    //     }

    //     return this.execute(async () => {
    //         return {
    //             items: await ProductsModel.find(
    //                 query,
    //                 {},
    //                 {
    //                     skip: pagination.pageSize * (pagination.pageNumber - 1),
    //                     limit: pagination.pageSize,
    //                 }
    //             ),
    //             totalItemsCount: await ProductsModel.countDocuments(query),
    //         };
    //     });
    // }

    getAllSponsoredProductsByGroupId(groupId, criteria) {
        const pagination = {
            pageNumber: criteria.pageNumber,
            pageSize: criteria.pageSize,
        };
        const paginationErrors =
            this.validateAndSanitizePaginationProps(pagination);
        if (paginationErrors) {
            return paginationErrors;
        }
        const query = {
            groupId: groupId,
            sponsored: true,
        };
        if (criteria.sponsored) {
            query.sponsored = criteria.sponsored;
        }
        return this.execute(async () => {
            return {
                items: await ProductsModel.find(
                    query,
                    {},
                    {
                        skip: pagination.pageSize * (pagination.pageNumber - 1),
                        limit: pagination.pageSize,
                    }
                ),
                totalItemsCount: await ProductsModel.countDocuments(query),
            };
        });
    }

    async searchByTagsAndName(groupId, search, minPrice, maxPrice) {
        try {
            const searchFilter = {
                groupId: groupId
            };

            if (search) {
                searchFilter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { desc: { $regex: search, $options: 'i' } },
                    { tags: { $in: search.split(",").map(tag => new RegExp(tag, 'i')) } },
                    { category: { $regex: search, $options: 'i' } },
                    { model: { $regex: search, $options: 'i' } },
                    { productSlug: { $regex: search, $options: 'i' } },
                    { rating: { $regex: search, $options: 'i' } },
                    { termsAndConditions: { $regex: search, $options: 'i' } },
                    { buyPrice: { $regex: search, $options: 'i' } },
                    { memberPrice: { $regex: search, $options: 'i' } },
                    { marketPrice: { $regex: search, $options: 'i' } },
                    { regularPrice: { $regex: search, $options: 'i' } },
                    { variants: { $regex: search, $options: 'i' } },
                    { rating: { $regex: search, $options: 'i' } },
                    { serialNumber: { $regex: search, $options: 'i' } },
                    { serialNumber: { $regex: search, $options: 'i' } },
                ];
            }

            if (minPrice !== undefined && maxPrice !== undefined) {
                searchFilter.buyPrice = {
                    $gte: minPrice,
                    $lte: maxPrice
                };
            } else if (minPrice !== undefined) {
                searchFilter.buyPrice = {
                    $gte: minPrice
                };
            } else if (maxPrice !== undefined) {
                searchFilter.buyPrice = {
                    $lte: maxPrice
                };
            }

            const services = await ProductsModel.find(searchFilter);

            const response = {
                status: "Success",
                data: {
                    items: services,
                    totalItemsCount: services.length
                }
            };

            return response;

        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async getAllProductsByGroupId(groupId, minPrice, maxPrice, name, productcode, categoryId, model, serialNumber, subcategoryId, criteria) {
        const groupQuery = { groupId: groupId };
        const orQueries = [];

        if (name) {
            orQueries.push({ name: { $regex: name, $options: 'i' } });
        }

        if (productcode) {
            orQueries.push({ productcode: productcode });
        }

        if (categoryId) {
            orQueries.push({ categoryId: categoryId });
        }

        if (model) {
            orQueries.push({ model: model });
        }

        if (subcategoryId) {
            orQueries.push({ subcategoryId: subcategoryId });
        }

        if (serialNumber) {
            orQueries.push({ serialNumber: serialNumber });
        }

        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
            groupQuery.marketPrice = {
                $gte: parseFloat(minPrice),
                $lte: parseFloat(maxPrice)
            };
        }

        if (criteria && criteria.search) {
            const searchRegex = new RegExp(criteria.search, "i");
            orQueries.push({
                $or: [
                    { name: searchRegex },
                    { desc: searchRegex },
                    { tags: { $in: [searchRegex] } },
                    { category: searchRegex },
                    { subCategory: searchRegex },
                    { model: searchRegex },
                    { productSlug: searchRegex }
                ]
            });
        }

        if (orQueries.length > 0) {
            groupQuery.$or = orQueries;
        }
        const result = this.preparePaginationAndReturnData(groupQuery, criteria);
        return result;
    }


}


module.exports = new ProductsService(ProductsModel, "products");
