import express from "express";
import upload from "../utils/multer.js";
import * as category from "../controllers/categoryController.js";

const router = express.Router();

// Category Routes
router.post("/category", upload.single("image"), category.createCategory);
router.get("/categories", category.getAllCategories);
router.get("/category/:id", category.getCategoryById);
router.put("/category/:id", upload.single("image"), category.updateCategoryById);
router.delete("/category/:id", category.deleteCategoryById);


// SubCategory Routes
router.post("/category/:categoryId/subcategory", upload.single("image"), category.createSubCategory);
router.get("/category/:categoryId/subcategories", category.getSubCategoriesByCategory);
router.get("/category/:categoryId/subcategory/:subCategoryId", category.getSubCategoryById);
router.put("/category/:categoryId/subcategory/:subCategoryId", upload.single("image"), category.updateSubCategoryById);
router.delete("/category/:categoryId/subcategory/:subCategoryId", category.deleteSubCategoryById);



// Create item under SubCategory
router.post("/item/:subCategoryId", upload.single("image"), category.createItem);
router.get("/item/:subCategoryId", category.getItemsBySubCategory);
router.get("/item/:id", category.getItemById);
router.put("/item/:id", upload.single("image"), category.updateItemById);
router.delete("/item/:id", category.deleteItemById);


export default router;
