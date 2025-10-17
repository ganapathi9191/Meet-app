import express from "express";
import * as vendor from "../controllers/vendorController.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.post("/vendor-login", vendor.vendorLogin);


// Create vendor + shaller with image upload
router.post("/vendor", upload.single("image"), vendor.createVendorWithShaller);
router.get("/vendors", vendor.getAllVendors);
router.get("/vendor/:id", vendor.getVendorById);
router.put("/update-vendor/:id", upload.single("image"), vendor.updateVendorById);
router.delete("/delete-vendor/:id", vendor.deleteVendorById);
router.put("/update-working-status/:id", vendor.updateWorkingStatus);


export default router;
