const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            required: true,
        },
        groupId: {
            type: Number,
            required: true,
        },
        products: [
            {
                productcode: {
                    type: Number,
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
                amount:{
                    type:Number,
                }
            }
        ],
        cartId :{
            type: Number
        }
    },
    { strict: false, timestamps: true }
);
CartSchema.plugin(require("mongoose-autopopulate"));
const CartModel = mongoose.model("cart", CartSchema);
module.exports = CartModel;
