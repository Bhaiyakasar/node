const InventryModel = require("../schema/inventry.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const WarehouseModel = require("../schema/warehouse.schema")
const ProductModel = require("../schema/products.schema")
class InventryService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }


    async getWarehouseName(groupId, wareHouseId) {
        try {
            const warehouse = await WarehouseModel.findOne({ groupId: groupId, wareHouseId: wareHouseId });
            return warehouse ? warehouse.WareHouseName : null;
        } catch (error) {
            console.error("Error fetching warehouse name:", error.message);
            throw error;
        }
    }
    async updateProducts(groupId, productcode, inventoryData) {
        try {
            console.log("Updating product with groupId:", groupId, "and productcode:", productcode);
            console.log("Inventory data before update:", inventoryData);
    
            const filter = { groupId: groupId, productcode: productcode };
            const update = {
                $set: {
                    buyingPrice: inventoryData.buyingPrice,
                    memberPrice: inventoryData.memberPrice,
                    regularPrice: inventoryData.regularPrice,
                    marketPrice: inventoryData.marketPrice,
                    gst: inventoryData.gst,
                    igst: inventoryData.igst,
                    sgst: inventoryData.sgst,
                    cgst: inventoryData.cgst
                }
            };
    
            const updateResult = await ProductModel.updateMany(filter, update);
    
            console.log("Update result:", updateResult);
    
            if (updateResult.modifiedCount === 1) {
                console.log("Product updated successfully.");
            } else if (updateResult.matchedCount === 0) {
                console.log("No matching product found.");
            } else {
                console.log("Product update failed.");
            }
    
            return updateResult;
        } catch (error) {
            throw new Error(`Error updating products: ${error.message}`);
        }
    }

    async getAllProductsByInventry(groupId, search, wareHouseId, productId) {
        try {
            const inventryProductCodes = await InventryModel.distinct('productcode');
            if (!inventryProductCodes) {
                throw new Error('inventry product codes not found');
            }
            const productQuery = {
                groupId: groupId,
                productcode: { $in: inventryProductCodes },
            };

            if (search) {
                const numericSearch = parseInt(search);
                if (!isNaN(numericSearch)) {
                    productQuery.$or = [
                        { name: { $regex: search, $options: 'i' } },
                    ];
                } else {
                    productQuery.$or = [
                        { name: { $regex: search, $options: 'i' } },
                    ];
                }
            }

            const products = await ProductModel.find(
                productQuery,
                {
                    name: 1,
                    productcode: 1,
                    groupId: 1,
                    _id: 0,
                }
            );
            if (!products) {
                throw new Error('product not found');
            }
            const productCodes = products.map(product => product.productcode);
            const groupIds = products.map(product => product.groupId);
            let inventryQuery = {};

            if (groupIds.length > 0 && productCodes.length > 0) {
                inventryQuery = {
                    productcode: { $in: productCodes },
                    groupId: { $in: groupIds }
                };
            } else if (groupIds.length > 0) {
                inventryQuery = {
                    groupId: { $in: groupIds }
                };
            }

            if (wareHouseId) {
                inventryQuery.wareHouseId = wareHouseId;
            }

            if (productId) {
                inventryQuery.productId = productId;
            }

            const inventryData = await InventryModel.find(inventryQuery);
            if (!inventryData) {
                throw new Error('inventry not found');
            }
            return {
                status: "data fetched successfully",
                data: {
                    items: inventryData,
                },
            };
        } catch (error) {
            console.error(error);
            throw new Error('Failed to get products from Inventry');
        }
    }



}
module.exports = new InventryService(InventryModel, 'inventry');
