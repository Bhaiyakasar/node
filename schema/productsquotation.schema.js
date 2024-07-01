const mongoose = require("mongoose");

const ProductsQuotationSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true
        },
        intent: {
            type: Number,
            required: true
        },
        quotationId: {
            type: Number,
            required: false
        },
        quotationDate: {
            type: Date,
            required: true
        },
        supplier: {
            type: Number,
            required: true
        },
        products: [
            {
                product: {
                    type: Number,
                    required: true
                },
                qty: {
                    type: Number,
                    required: true
                },
                perUnit: {
                    type: Number,
                    required: true
                },
                tax: {
                    type: Number,
                    required: true
                }
            }
        ],
        shippingDetails: {
            type: {
                driverName: String,
                vehicleNo: String,
                driverNo: Number,
                transport: String,
                transportId: Number,
                name: String,
                contactPerson: String,
                dispatchNo: String
            },
            required: true
        }
    },
    { strict: false, timestamps: true }
);

const ProductsQuotationModel = mongoose.model("productsquotation", ProductsQuotationSchema);
module.exports = ProductsQuotationModel;