const mongoose = require("mongoose");

const BuysellSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: false,
        },
        groupId: {
            type: Number,
            required: false,
        },
        userId: {
            type: Number,
            required: false
        },
        postId:{
            type:Number,
            required: false
        },
        quantity:{
            type:Number,
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
        model:{
            type:String,
            required: false,
        },
       
        category: {
            type: String,
            enum: []
          },
        categoryId: {
            type:Number,
            required: false,
        
        },
        subCategory: {
            type: String,
            required: false,
        },
        subcategoryId:{
            type:Number,
            required: false,
        },
        delivary: {
            type: Boolean,
            required: false,
        },
        sellingPrice:{
            type:Number,
            required: false,
        },
        tags: {
            type: [String],  // Allow an array of strings
            enum: []
          },
        image:{
            type:String,
            required:false
        }

    },
    { timestamps: true ,strict: false}
);
BuysellSchema.plugin(require("mongoose-autopopulate"));
const BuysellModel = mongoose.model("buysell", BuysellSchema);
module.exports = BuysellModel;
