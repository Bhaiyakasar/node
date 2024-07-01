const { default: mongoose, model } = require("mongoose");
const CartModel = require("../schema/cart.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const ServiceResponse = require("@baapcompany/core-api/services/serviceResponse");
const Products = require("../schema/products.schema");
const productService = require("../services/products.service");
const productsService = require("../services/products.service");
const ProductsModel = require("../schema/products.schema");

class CartService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getAllDataByGroupId(groupId, criteria) {
        const query = {
            groupId: groupId,
        };
        if (criteria.userId) query.userId = criteria.userId;
        if (criteria.name) query.name = new RegExp(criteria.name, "i");
        if (criteria.code) query.code = new RegExp(criteria.code, "i");

        return this.preparePaginationAndReturnData(query, criteria);
    }

    async saveProductInCart(details) {
        return this.execute(async () => {
            const { groupId, userId, products, cartId } = details;

            if (!Array.isArray(products)) {
                return {
                    status: "Failed",
                    message: "Invalid 'products' data provided.",
                };
            }

            let createCart = await this.model.findOne({
                groupId,
                userId: Number(userId),
            });

            if (!createCart) {
                createCart = await this.model.create({
                    groupId,
                    cartId,
                    userId: Number(userId),
                    products: products.map((product) => ({
                        productcode: Number(product.productcode),
                        quantity: Number(product.quantity),
                        discount: product.discount
                    })),
                });
            } else {
                const existingProductCodes = createCart?.products?.map((product) =>
                    Number(product.productcode)
                );

                let hasDuplicate = false;
                products.forEach((product) => {
                    const productcode = Number(product.productcode);
                    if (existingProductCodes.includes(productcode)) {
                        hasDuplicate = true;
                        return;
                    }

                    createCart.products.push({
                        productcode,
                        quantity: Number(product.quantity),
                        amount: product.amount,
                        percentage: product.percentage,
                    });
                });

                if (hasDuplicate) {
                    return {
                        status: "Failed",
                        message: "Product already exists in the cart.",
                    };
                }

                await createCart.save();
            }

            const cart = await this.model
                .findOne({
                    groupId,
                    userId: userId,
                })
                .populate("products");

            return cart;
        });
    }

    async getAllProductsByCartId(cartId, name) {
        const query = { _id: cartId };
        const populateOptions = {
            path: "products.productId",
            match: name ? { name: { $regex: name, $options: "i" } } : {},
        };

        const cart = await this.model
            .findOne(query)
            .populate(populateOptions)
            .lean();

        if (cart && cart.products && name) {
            cart.products = cart.products.filter((product) =>
                product.productId.name
                    .toLowerCase()
                    .includes(name.toLowerCase())
            );
        }

        const response = {
            data: cart,
        };

        return response;
    }

    async getProductById(productId) {
        return productsService.getById(productId);
    }

    async getCartDetailsByGroupIdAndUserId(groupId, userId) {
        try {
            const cart = await CartModel.findOne({ groupId, userId }).exec();

            if (!cart) {
                return null;
            }

            const productDetails = [];
            let subtotal = 0;
            let totalProductPrice = 0;
            let totalTax = 0;
            let totalProductQuantity = 0;
            let totalCartPrice = 0;
            let discount = 0;

            for (const item of cart.products) {
                const product = await ProductsModel.findOne({ productcode: item.productcode }).exec();
                if (product) {
                    let gst = product.gst || 0;
                    let igst = product.igst || 0;
                    let sgst = product.sgst || 0;
                    let cgst = product.cgst || 0;
                    let tax = gst + igst + sgst + cgst;
                    let taxAmount = ((product.regularPrice * tax) / 100) * item.quantity;
                    gst = (product.regularPrice * gst) / 100;
                    igst = (product.regularPrice * igst) / 100;
                    sgst = (product.regularPrice * sgst) / 100;
                    cgst = (product.regularPrice * cgst) / 100;

                    if (item.percentage) {
                        let totalDiscount = ((product.regularPrice * item.percentage) / 100) * item.quantity;

                        productDetails.push({
                            productcode: {
                                productcode: product.productcode,
                                name: product.name,
                                categoryId: product.categoryId,
                                subcategoryId: product.subcategoryId,
                                pictures: product.pictures,
                                buyingPrice: product.buyingPrice,
                                memberPrice: product.memberPrice,
                                regularPrice: product.regularPrice,
                                marketPrice: product.marketPrice,
                                serialNumber: product.serialNumber,
                                hsnNo: product.hsnNo || 0,
                                discount: totalDiscount || 0,
                                gst: gst,
                                igst: igst,
                                sgst: sgst,
                                cgst: cgst,
                                tax: taxAmount.toFixed(2),
                            },
                            quantity: item.quantity,
                            totalProductPrice: parseFloat((product.regularPrice * item.quantity - totalDiscount + taxAmount).toFixed(2)),
                        });
                        subtotal += product.marketPrice * item.quantity;
                        totalProductPrice += product.regularPrice * item.quantity;
                        totalTax += taxAmount;
                        totalProductQuantity += item.quantity;
                        discount += totalDiscount || 0;
                        totalCartPrice = subtotal - discount;
                    } else if (item.amount) {
                        let totalDiscount = item.amount * item.quantity;

                        productDetails.push({
                            productcode: {
                                productcode: product.productcode,
                                name: product.name,
                                categoryId: product.categoryId,
                                subcategoryId: product.subcategoryId,
                                pictures: product.pictures,
                                buyingPrice: product.buyingPrice,
                                memberPrice: product.memberPrice,
                                regularPrice: product.regularPrice,
                                marketPrice: product.marketPrice,
                                serialNumber: product.serialNumber,
                                hsnNo: product.hsnNo,
                                discount: totalDiscount || 0,
                                gst: gst,
                                igst: igst,
                                sgst: sgst,
                                cgst: cgst,
                                tax: taxAmount.toFixed(2),
                            },
                            quantity: item.quantity,
                            totalProductPrice: parseFloat((product.regularPrice * item.quantity - totalDiscount + taxAmount).toFixed(2)),
                        });
                        subtotal += product.marketPrice * item.quantity;
                        totalProductPrice += product.regularPrice * item.quantity;
                        totalTax += taxAmount;
                        totalProductQuantity += item.quantity;
                        discount += totalDiscount || 0;
                        totalCartPrice = subtotal - discount;
                    } else {
                        productDetails.push({
                            productcode: {
                                productcode: product.productcode,
                                name: product.name,
                                categoryId: product.categoryId,
                                subcategoryId: product.subcategoryId,
                                pictures: product.pictures,
                                buyingPrice: product.buyingPrice,
                                memberPrice: product.memberPrice,
                                regularPrice: product.regularPrice,
                                marketPrice: product.marketPrice,
                                serialNumber: product.serialNumber,
                                hsnNo: product.hsnNo || 0,
                                discount: 0, // No discount applied
                                gst: gst,
                                igst: igst,
                                sgst: sgst,
                                cgst: cgst,
                                tax: taxAmount.toFixed(2),
                            },
                            quantity: item.quantity,
                            totalProductPrice: parseFloat((product.regularPrice * item.quantity + taxAmount).toFixed(2)), // No discount applied
                        });
                        subtotal += product.marketPrice * item.quantity;
                        totalProductPrice += product.regularPrice * item.quantity;
                        totalTax += taxAmount;
                        totalProductQuantity += item.quantity;
                        totalCartPrice = subtotal;
                    }
                }
            }

            const taxes = totalTax;
            const saving = subtotal - totalProductPrice;

            const response = {
                status: 'Success',
                data: {
                    ...cart.toJSON(),
                    products: productDetails,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    taxes: parseFloat(taxes.toFixed(2)),
                    saving: parseFloat((discount + saving).toFixed(2)),
                    totalProductQuantity,
                    totalCartPrice: parseFloat((subtotal - saving - discount + totalTax).toFixed(2)),
                },
            };

            return response;
        } catch (error) {
            throw new Error('Internal server error');
        }
    }


    async deleteProductByCart(cartId, productcode) {
        return this.updateById(cartId, {
            $pull: { products: { productcode: Number(productcode) } },
        });
    }

    async deleteProductByGroupIdUserIdCartId(groupId, cartId, productCode) {
        try {
            const cart = await CartModel.findOne({ groupId, cartId });

            if (!cart) {
                return {
                    status: 404,
                    message: 'Cart not found',
                };
            }

            const updatedProducts = cart.products.filter(product => product.productcode !== Number(productCode));
            cart.products = updatedProducts;

            await cart.save();

            return {
                status: 200,
                message: 'Product deleted from the cart successfully',
            };
        } catch (error) {
            return {
                status: 500,
                message: 'Internal server error',
            };
        }
    }
    async updateProductQuantity(groupId, userId, productcode, quantity, amount) {
        try {
            const cart = await CartModel.findOne({ groupId, userId });

            if (!cart) {
                return {
                    status: 404,
                    message: 'Cart not found',
                };
            }

            const updatedProducts = cart.products.map(product => {
                if (product.productcode === Number(productcode)) {
                    // Check if quantity or amount is provided and update accordingly
                    const updatedProduct = { ...product };
                    if (quantity !== undefined) {
                        updatedProduct.quantity = Number(quantity);
                    }
                    if (amount !== undefined) {
                        updatedProduct.amount = Number(amount);
                    }
                    return updatedProduct;
                }
                return product;
            });

            cart.products = updatedProducts;

            await cart.save();

            return {
                status: 200,
                message: 'Cart updated successfully',
            };
        } catch (error) {
            return {
                status: 500,
                message: 'Internal server error',
            };
        }
    }


    async deleteAllProducts(groupId, userId) {
        try {
            const cart = await CartModel.findOne({ groupId, userId });

            if (!cart) {
                return {
                    status: 404,
                    message: "Cart not found",
                };
            }

            cart.products = [];
            await cart.save();

            return {
                status: 200,
                message: "All products deleted from the cart successfully",
            };
        } catch (error) {
            return {
                status: 500,
                message: "Internal server error",
            };
        }
    }

}

module.exports = new CartService(CartModel, "cart");
