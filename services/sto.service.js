const STOModel = require("../schema/sto.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ProductsModel = require("../schema/products.schema");
const WarehouseModel = require("../schema/warehouse.schema");

class STOService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }
    async updateStoById(stoId, groupId, newData) {
        try {
            const updateSto = await STOModel.findOneAndUpdate(
                { stoId: stoId, groupId: groupId },
                newData,
                { new: true }
            );
            return updateSto;
        } catch (error) {
            throw error;
        }
    }

    async getAllDataByGroupId(groupId,stoId) {
        try {
            const query = { groupId: groupId };
            if (stoId) {
                query.stoId = stoId; 
            }
            const stoDocuments = await STOModel.find(query).lean();
    
            if (!stoDocuments || stoDocuments.length === 0) {
                throw new Error('No data found for the given groupId');
            }
    
            const enrichedDocuments = await Promise.all(stoDocuments.map(async (stoDocument) => {
                let warehouse = null;
    
                if (stoDocument.wareHouseId) {
                    warehouse = await WarehouseModel.findOne({ wareHouseId: stoDocument.wareHouseId }).lean();
                    if (!warehouse) {
                        throw new Error(`No warehouse data found for warehouseId: ${stoDocument.wareHouseId}`);
                    }
                }
    
                const products = stoDocument.products || [];
                if (!Array.isArray(products)) {
                    throw new Error('Products field is not an array');
                }
    
                const enrichedProducts = await Promise.all(products.map(async (product) => {
                    const productData = await ProductsModel.findOne({ productcode: product.productcode }).lean();
    
                    if (!productData) {
                        return {
                            productcode: product.productcode,
                            Qty: product.Qty,
                        };
                    }
    
                    return {
                        productcode: product.productcode,
                        Qty: product.Qty,
                        name: productData.name,
                        value: productData.value,
                        characteristics: productData.characteristics || []
                    };
                }));
    
                return {
                    stoId: stoDocument.stoId,
                    groupId: stoDocument.groupId,
                    status: stoDocument.status,
                    products: enrichedProducts,
                    type: stoDocument.type,
                    Qty: stoDocument.Qty,
                    from: stoDocument.from,
                    destination: stoDocument.destination,
                    price: stoDocument.price,
                    STOdate: stoDocument.STOdate,
                    expectedDeliveryDate: stoDocument.expectedDeliveryDate,
                    warehouse: warehouse ? {
                        wareHouseId: warehouse.wareHouseId,
                        WareHouseName: warehouse.WareHouseName,
                    } : {}
                };
            }));
    
            return {
                message: "Leads data fetched successfully",
                data: {
                    items: enrichedDocuments
                }
            };
        } catch (error) {
            console.error('Error in getAllDataByGroupId:', error);
            throw error;
        }
    }
    
}    

module.exports = new STOService(STOModel, 'sto');
