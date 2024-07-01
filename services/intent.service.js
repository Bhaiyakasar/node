const IntentModel = require("../schema/intent.schema");
const ProductsQuotationModel = require("../schema/productsquotation.schema")
const suppliersModel = require("../schema/supplier.schema")
const productModel = require("../schema/products.schema")
const WarehouseModel = require("../schema/warehouse.schema")
const BaseService = require("@baapcompany/core-api/services/base.service");

class IntentService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getByGroupId(groupId, intentId, supplierId) {
        try {
            let query = {
                groupId: groupId
            };

            if (intentId) {
                query.intentId = intentId;
            }

            const intents = await IntentModel.find(query);

            const transformedIntents = await Promise.all(intents.map(async intent => {
                const warehouse = await WarehouseModel.findOne({ wareHouseId: intent.warehouseId });

                let filteredSuppliers = [];
                let suppliersDetails = [];

                if (supplierId) {
                    filteredSuppliers = intent.suppliers.filter(supplier => supplier === parseInt(supplierId));
                    suppliersDetails = await Promise.all(filteredSuppliers.map(async (supplier) => {
                        const supplierData = await suppliersModel.findOne({ supplierId: supplier });
                        return {
                            supplierId: supplier,
                            name: supplierData ? supplierData.name : "Unknown",
                            addresses: supplierData ? supplierData.addresses : "Unknown",
                            phoneNumber: supplierData ? supplierData.phoneNumber : "Unknown",
                            email: supplierData ? supplierData.email : "Unknown",
                            gstNo: supplierData ? supplierData.gstNo : "Unknown",
                            accountDetails: supplierData ? supplierData.accountDetails : "Unknown"
                        };
                    }));
                } else {
                    suppliersDetails = await Promise.all(intent.suppliers.map(async (supplier) => {
                        const supplierData = await suppliersModel.findOne({ groupId: groupId, supplierId: supplier });
                        return {
                            supplierId: supplier,
                            name: supplierData ? supplierData.name : "Unknown",
                            addresses: supplierData ? supplierData.addresses : "Unknown",
                            phoneNumber: supplierData ? supplierData.phoneNumber : "Unknown",
                            email: supplierData ? supplierData.email : "Unknown",
                            gstNo: supplierData ? supplierData.gstNo : "Unknown",
                            accountDetails: supplierData ? supplierData.accountDetails : "Unknown"
                        };
                    }));
                }

                const productsDetails = await Promise.all(intent.products.map(async product => {
                    const productData = await productModel.findOne({ groupId: groupId, productcode: product.productcode });

                    if (!productData) {
                        return {
                            productcode: product.productcode
                        };
                    }

                    return {
                        productcode: product.productcode,
                        qty: product.qty,
                        unit: product.unit,
                        name: productData.name,
                        value: productData.value,
                        chacharacteristics: productData.characteristics
                    };
                }));

                let totalQty = 0;
                productsDetails.forEach(product => {
                    totalQty += product.qty;
                });

                const intentIds = [intent.intentId];
                const quotationCount = await ProductsQuotationModel.countDocuments({ groupId: groupId, intent: { $in: intentIds } });

                return {
                    ...intent.toObject(),
                    totalQty: totalQty,
                    warehouse: {
                        wareHouseId: intent.warehouseId,
                        name: warehouse ? warehouse.WareHouseName : "Unknown",
                        locationName: warehouse ? warehouse.locationName : "Unknown",
                        pinCode: warehouse ? warehouse.pinCode : "Unknown",
                        location: warehouse ? warehouse.location : "Unknown"
                    },
                    products: productsDetails,
                    suppliers: suppliersDetails,
                    quotationCount: quotationCount
                };
            }));

            return {
                status: "data fetched successfully",
                data: {
                    items: transformedIntents
                },
                totalIntents: intents.length
            };
        } catch (error) {
            console.log(error);
            throw new Error("Failed to get products Intent");
        }
    }

    async updateByGroupIdAndIntentId(groupId, intentId, updatedData) {
        try {
            const purchaseOrder = await this.model.findOneAndUpdate(
                { groupId, intentId },
                { $set: updatedData },
                { new: true }
            );

            if (!purchaseOrder) {
                throw new Error("Purchase order not found", 404);
            }

            return {
                status: "Purchase order updated successfully",
                data: purchaseOrder
            };
        } catch (error) {
            console.error(error);
            throw new Error("Internal server error", 500);
        }
    }


}

module.exports = new IntentService(IntentModel, 'intent');
