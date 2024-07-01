const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/category.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post(
    "/",
    checkSchema(require("../dto/category.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const categoryId = +Date.now();

        req.body.categoryId = categoryId;
        const serviceResponse = await service.create(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);
router.post("/bulk", async (req, res) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }

    const serviceResponse = await service.bulkadd(req.body, req.query.appId);

    requestResponsehelper.sendResponse(res, serviceResponse);
});
// router.post(
//     "/savefavorite",
//     checkSchema(require("../dto/category.dto")),
//     async (req, res, next) => {
//         if (ValidationHelper.requestValidationErrors(req, res)) {
//             return;
//         }
//         const { userId, groupId, categories } = req.body;

//         try {
//             if (!Array.isArray(categories)) {
//                 throw new Error("Categories must be an array");
//             }

//             const items = [];

//             for (const categoryData of categories) {
//                 const { name, imageUrl, description } = categoryData;

//                 const category = {
//                     userId,
//                     groupId,
//                     name,
//                     imageUrl,
//                     description,
//                 };

//                 const serviceResponse = await service.create(category);
//                 items.push(serviceResponse);
//             }

//             const responseData = {
//                 userId,
//                 groupId,

//                 items,
//             };

//             requestResponsehelper.sendResponse(res, {
//                 success: true,
//                 data: responseData,
//             });
//         } catch (error) {
//             console.error(error);
//             requestResponsehelper.sendResponse(res, {
//                 error: "Failed to save the favorite categories",
//             });
//         }
//     }
// );
// router.post(
//     "/saveFavoriteCategories",
//     checkSchema(require("../dto/category.dto")),
//     async (req, res, next) => {
//         if (ValidationHelper.requestValidationErrors(req, res)) {
//             return;
//         }
//         const categoriesId = +Date.now();

//         // Set the generated ID in the request body
//         req.body.categoriesId = categoriesId;
//         const serviceResponse = await service.saveProductInCart(req.body);
//         requestResponsehelper.sendResponse(res, serviceResponse);
//     }
// );
router.delete("/:id", async (req, res) => {
    const serviceResponse = await service.deleteById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
    const serviceResponse = await service.updateById(req.params.id, req.body);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
    const serviceResponse = await service.getById(req.params.id);

    requestResponsehelper.sendResponse(res, serviceResponse);
});
router.get("/all/Category", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria(req.query);

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const search = req.query.search
    const criteria = {
        userId: req.query.userId,
        name: req.query.name,
        categoryId: req.query.categoryId,
        tags: req.query.tags,
        isBusinessEnable: req.query.isBusinessEnable,
        isCommerceEnable: req.query.isCommerceEnable,
    };

    const serviceResponse = await service.getAllDataByGroupId(groupId, criteria, search);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/categoryId/:categoryId",async(req,res)=>{
   const categoryId=req.params.categoryId

   let categoryData=await service.getDataByCategoryId(categoryId)
   res.status(200).json(categoryData)
})

module.exports = router;
