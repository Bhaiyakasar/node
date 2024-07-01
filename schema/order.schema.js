const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    orderId: {
        type: Number,
        required: false
    },
    productcode: {
        type: Number,
        required: false,
    },
    challanNo: {
        type: Number,
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    buyingPrice: {
        type: Number,
        required: false,
    },
    memberPrice: {
        type: Number,
        required: false,
    },
    regularPrice: {
        type: Number,
        required: false,
    },
    marketPrice: {
        type: Number,
        required: false,
    },
    gst: {
        type: Number,
        default: 0,
    },
    igst: {
        type: Number,
        default: 0,
    },
    cgst: {
        type: Number,
        default: 0,
    },
    sgst: {
        type: Number,
        default: 0,
    },
    hsncode: {
        type: Number
    },
    tax: {
        type: Number
    },
    serialNumber: {
        type: Number
    }
}, { _id: false, strict: false });

const ShippingAddressSchema = new mongoose.Schema({
    street: String,
    locality: String,
    city: String,
    state: String,
    zip: String,
    shippingAddress: { type: Boolean, default: false }
}, { _id: false, strict: false });

const BillingAddressSchema = new mongoose.Schema({
    street: String,
    locality: String,
    city: String,
    state: String,
    zip: String,
    billingAddress: { type: Boolean, default: false }
}, { _id: false, strict: false });

const OrderDetailSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: true,
    },
    totalProductPrice: {
        type: Number,
        required: true,
    },
    product: {
        type: ProductSchema,
        required: true,
    },
}, { _id: false, strict: false });

const DeliveryInfoSchema = new mongoose.Schema({
    shipping_address: {
        type: ShippingAddressSchema,
    },
    billing_address: {
        type: BillingAddressSchema,
    }
}, { _id: false, strict: false });

const PaymentInfoSchema = new mongoose.Schema({
    mode: { type: String, required: true },
    paymentStatus: { type: String, default: "unpaid" },
    upi: { type: String },
    txnId: { type: String },
    paymentDateTime: { type: String },
    loggedInUser: { type: Number },
    expectedDeliveryDate: { type: String },
    creditPaymentDate: { type: String }
}, { _id: false, strict: false });

const OrderSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
            required: true,
        },
        orderDetails: {
            type: [OrderDetailSchema],
            default: [],
        },
        orderId: {
            type: Number,
            required: false,
        },
        status: {
            type: String,
            enum: ["new", "inprogress", "dispatched", "intransit", "delivered", "completed", "canceled", "return"],
            default: "new",
        },
        event: {
            type: String,
            default: "order",
        },
        userId: {
            type: Number,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
        saving: {
            type: Number,
            required: true,
        },
        taxes: {
            type: Number,
            required: true,
        },
        totalCartPrice: {
            type: Number,
            required: true,
        },
        totalProductQuantity: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "Rs",
        },
        source: {
            type: String,
            required: true,
        },
        delivery_info: {
            type: DeliveryInfoSchema,
        },
        paymentInfo: {
            type: PaymentInfoSchema,
        },
        wareHouseId: {
            type: Number
        },
        location: {
            type: {
                type: String,
                default: 'Point'
            },
            coordinates: [Number]
        },
        orderDate: String,
        assignedTo: String
    },
    { strict: false, timestamps: true }
);

OrderSchema.plugin(require("mongoose-autopopulate"));
const OrderModel = mongoose.model("order", OrderSchema);
module.exports = OrderModel;