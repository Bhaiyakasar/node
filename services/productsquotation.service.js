const ProductsQuotationModel = require("../schema/productsquotation.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const SupplierModule = require("../schema/supplier.schema");
const ProductsModel = require("../schema/products.schema");
const IntentModule = require("../schema/intent.schema");
const WarehouseModule = require("../schema/warehouse.schema");

class ProductsQuotationService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async createIfNotExists(quotationData) {
        const { groupId, intent, supplier } = quotationData;

        const existingQuotation = await ProductsQuotationModel.findOne({
            groupId: groupId,
            intent: intent,
            supplier: supplier
        });

        if (existingQuotation) {
            return {
                success: false,
                message: "Products quotation already exists for the given supplier."
            };
        }

        quotationData.quotationId = +Date.now();
        const newQuotation = new ProductsQuotationModel(quotationData);
        await newQuotation.save();

        return {
            success: true,
            message: "Productsquotation created successfully.",
            data: newQuotation
        };
    }

    async getByGroupIdAndIntent(groupId, intentId) {
        try {
            const quotations = await this.model.find({ groupId, intent: intentId });

            if (!quotations || quotations.length === 0) {
                throw new Error("Quotations not found for the given intentId", 404);
            }

            let responseData = [];

            await Promise.all(quotations.map(async (quotation) => {
                const supplier = await SupplierModule.findOne({ groupId: groupId, supplierId: quotation.supplier });

                if (!supplier) {
                    const supplierId = quotation.supplier;
                    throw new Error(`Supplier not found for quotation with ID ${quotation.quotationId}, Supplier ID: ${supplierId}`, 404);
                }

                const intent = await IntentModule.findOne({ groupId, intentId });

                if (!intent) {
                    const intentId = quotation.intent;
                    throw new Error(`Intent not found for quotation with ID ${quotation.quotationId}, Intent ID: ${intentId}`, 404);
                }

                const warehouse = await WarehouseModule.findOne({ groupId: groupId, wareHouseId: intent.warehouseId });

                if (!warehouse) {
                    const warehouseId = intent.warehouseId;
                    throw new Error(`Warehouse not found for quotation with ID ${quotation.quotationId}, Warehouse ID: ${warehouseId}`, 404);
                }

                let totalProductQty = 0;
                let totalTax = 0;
                let totalTaxAmount = 0;
                let totalProductAmount = 0;
                let totalProductPriceExcludingTax = 0;
                let products = [];

                await Promise.all(quotation.products.map(async product => {
                    const productDetail = await ProductsModel.findOne({ groupId, productcode: product.product });
                    const totalAmount = product.perUnit * product.qty;
                    const taxAmount = (totalAmount * product.tax) / 100;
                    const totalPriceExcludingTax = totalAmount + taxAmount;

                    totalProductQty += product.qty;
                    totalTax += product.tax;
                    totalTaxAmount += taxAmount;
                    totalProductAmount += totalAmount;
                    totalProductPriceExcludingTax += totalPriceExcludingTax;

                    products.push({
                        product: {
                            productcode: productDetail.productcode,
                            name: productDetail.name,
                            hsnNo: productDetail.hsnNo
                        },
                        qty: product.qty,
                        unit: product.unit,
                        perUnit: product.perUnit,
                        totalAmount,
                        tax: product.tax,
                        taxAmount,
                        totalPriceExcludingTax
                    });
                }));

                const response = {
                    groupId: Number(groupId),
                    intent: {
                        intentId: intent.intentId,
                        warehouse: {
                            WareHouseName: warehouse.WareHouseName,
                            locationName: warehouse.locationName,
                            pinCode: warehouse.pinCode,
                            location: warehouse.location
                        },
                        expecteDeliveryDate: intent.expecteDeliveryDate
                    },
                    quotationId: quotation.quotationId,
                    quotationDate: quotation.quotationDate,
                    supplier: {
                        supplierId: supplier.supplierId,
                        name: supplier.name,
                        addresses: supplier.addresses,
                        phoneNumber: supplier.phoneNumber,
                        email: supplier.email,
                        gstNo: supplier.gstNo,
                        accountDetails: supplier.accountDetails
                    },
                    products,
                    totalProductQty,
                    totalTax,
                    totalTaxAmount,
                    totalProductAmount,
                    totalProductPriceExcludingTax,
                    shippingDetails: quotation.shippingDetails
                };

                responseData.push(response);
            }));

            return {
                status: "data fetched successfully",
                data: {
                    items: responseData
                }
            };
        } catch (error) {
            console.error(error);
            throw new Error(error.message, error.status);
        }
    }

    async getByGroupIdAndQuotationId(groupId, quotationId, page = 1, limit = 30) {
        try {
            let query = { groupId };

            if (quotationId) {
                query.quotationId = quotationId;
            }

            const quotations = await ProductsQuotationModel.find(query)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .exec();

            if (!quotations || quotations.length === 0) {
                throw new Error("Quotations not found for the given criteria", 404);
            }

            let responseData = [];

            await Promise.all(quotations.map(async (quotation) => {
                const supplier = await SupplierModule.findOne({ groupId: groupId, supplierId: quotation.supplier });

                if (!supplier) {
                    const supplierId = quotation.supplier;
                    throw new Error(`Supplier not found for quotation with ID ${quotation.quotationId}, Supplier ID: ${supplierId}`, 404);
                }

                const intent = await IntentModule.findOne({ groupId, intentId: quotation.intent });

                if (!intent) {
                    const intentId = quotation.intent;
                    throw new Error(`Intent not found for quotation with ID ${quotation.quotationId}, Intent ID: ${intentId}`, 404);
                }

                const warehouse = await WarehouseModule.findOne({ groupId: groupId, wareHouseId: intent.warehouseId });

                if (!warehouse) {
                    const warehouseId = intent.warehouseId;
                    throw new Error(`Warehouse not found for quotation with ID ${quotation.quotationId}, Warehouse ID: ${warehouseId}`, 404);
                }

                let totalProductQty = 0;
                let totalTax = 0;
                let totalTaxAmount = 0;
                let totalProductAmount = 0;
                let totalProductPriceExcludingTax = 0;
                let products = [];

                await Promise.all(quotation.products.map(async product => {
                    const productDetail = await ProductsModel.findOne({ groupId, productcode: product.product });
                    const totalAmount = product.perUnit * product.qty;
                    const taxAmount = (totalAmount * product.tax) / 100;
                    const totalPriceExcludingTax = totalAmount + taxAmount;

                    totalProductQty += product.qty;
                    totalTax += product.tax;
                    totalTaxAmount += taxAmount;
                    totalProductAmount += totalAmount;
                    totalProductPriceExcludingTax += totalPriceExcludingTax;

                    products.push({
                        product: {
                            productcode: productDetail.productcode,
                            name: productDetail.name,
                            hsnNo: productDetail.hsnNo
                        },
                        qty: product.qty,
                        perUnit: product.perUnit,
                        totalAmount,
                        tax: product.tax,
                        taxAmount,
                        totalPriceExcludingTax
                    });
                }));

                const processedQuotationData = {
                    groupId: Number(groupId),
                    intent: {
                        intentId: intent.intentId,
                        warehouse: {
                            WareHouseName: warehouse.WareHouseName,
                            locationName: warehouse.locationName,
                            pinCode: warehouse.pinCode,
                            location: warehouse.location
                        },
                        expecteDeliveryDate: intent.expecteDeliveryDate
                    },
                    quotationId: quotation.quotationId,
                    quotationDate: quotation.quotationDate,
                    supplier: {
                        supplierId: supplier.supplierId,
                        name: supplier.name,
                        addresses: supplier.addresses,
                        phoneNumber: supplier.phoneNumber,
                        email: supplier.email,
                        gstNo: supplier.gstNo,
                        accountDetails: supplier.accountDetails
                    },
                    products,
                    totalProductQty,
                    totalTax,
                    totalTaxAmount,
                    totalProductAmount,
                    totalProductPriceExcludingTax,
                    shippingDetails: quotation.shippingDetails
                };

                responseData.push(processedQuotationData);
            }));

            return {
                status: "data fetched successfully",
                data: {
                    items: responseData
                }
            };
        } catch (error) {
            console.error(error);
            throw new Error(error.message, error.status);
        }
    }

    async updateQuotation(groupId, quotationId, data) {
        try {
            let quotation = await ProductsQuotationModel.findOneAndUpdate(
                { groupId: Number(groupId), quotationId: Number(quotationId) },
                { $set: data },
                { new: true, runValidators: true }
            );

            if (!quotation) {
                return {
                    message: "Quotation not found.",
                    data: null
                };
            }

            return {
                message: "Quotation updated successfully.",
                data: {
                    items: quotation
                }
            };
        } catch (error) {
            return {
                message: "Error updating quotation.",
                error: error.message
            };
        }
    }

}

module.exports = new ProductsQuotationService(ProductsQuotationModel, 'productsquotation');