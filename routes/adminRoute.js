import express from "express";
import * as admin from "../controllers/admin.js";

const router = express.Router();

router.post("/admin-login", admin.adminLogin);
router.post("/vendor-create", admin.createVendor);


// Admin adds or edits review for a vendor shop
router.put("/vendor-review", admin.addOrEditVendorReview);


export default router;
