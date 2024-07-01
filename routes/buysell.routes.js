const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/buysell.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/buysell.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const postId= +Date.now();
        req.body.postId=postId
        const serviceResponse = await service.saveproduct(req.body);
        res.json({
            data:serviceResponse
        })
    }
);

router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.delete("/:postId", async (req, res) => {
    try{
        const serviceResponse = await service.deletePostByPostId(req.params.postId);

        requestResponsehelper.sendResponse(res, serviceResponse);
    }catch(error){
        const { status, error: errorMessage } = error;
        return res.status(status).json({ error: errorMessage });
    }
});

router.put("/:postId", async (req, res) => {
    const serviceResponse = await service.updateproduct(req.params.postId, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/post/:postId", async (req, res) => {
    const serviceResponse = await service.getDetailsByPostId(req.params.postId);
    res.json({
        sellerDetails:serviceResponse.filterCustomer,
        productDetails:serviceResponse.saleProduct
       })
});


router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/buysell", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get('/', async (req, res) => {
    try{
  const key = req.query.key
  const product_search = await service.findKey(key)
  res.json({
    message : "Get data successfully",
    data:product_search
  })
    }catch(error){
        console.log(error);
        throw error;
    }

})

router.post(
    "/savePost",
    checkSchema(require("../dto/buysell.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        try {

        if (req.body.postId) {  //&& req.body.userId && req.body.groupId
                const existingPost = await service.getBypostId(req.body.postId);

                if (existingPost) {
                    const updatedData = {
                        ...req.body,
                        sellingprice: req.body.sellingprice,
                        quantity: req.body.quantity,
                        delivary: req.body.delivary,
                        image:req.body.image
                    };
                    const serviceResponse = await service.updatePost(req.body.postId, updatedData);
                    requestResponsehelper.sendResponse(res, serviceResponse);
                }else {
                    res.status(404).json({ error: "Post not found" });
                }
            } else {
                const postId = +Date.now();
                req.body.postId = postId;
                const serviceResponse = await service.saveproduct(req.body);
                res.json({
                    data: serviceResponse,
                });
            }
            
            }catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
    }

    
);


router.get("/All/:categoryId", async (req, res) => {
    try{
        const categoryId=req.params.categoryId;
        const serviceResponse = await service.getProductByCateoryId(categoryId);

        res.json({
            message:"get Categary product",
            data:serviceResponse
        })
    }catch(error){
        const { status, error: errorMessage } = error;
        return res.status(status).json({ error: errorMessage });
    }
   
});

module.exports = router;
