import express from "express";
import * as User from "../controllers/userController.js";
import { verifyToken } from "../utils/JWS.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.post("/send-otp", User.sendOtp);
router.post("/verify-otp", User.verifyOtp);

// Get all users
router.get("/getall-users", User.getAllUsers);
// Get single user by ID
router.get("/get/:userId", User.getUserById);


//----------------------personal info----------------------
// Personal info routes
router.post(
  "/create-or-update/personal-info",
  upload.single("image"),
  User.createOrUpdatePersonalInfo // ✅ correct name
);

router.get("/personal-infos", User.getAllPersonalInfos); // ✅ correct
router.get("/personal-info/:id", User.getPersonalInfoById); // ✅ correct
router.put("/personal-info/:id", upload.single("image"), User.updatePersonalInfoById); // ✅ add update
router.delete("/personal-info/:id", User.deletePersonalInfoById); // ✅ correct
// Live location routes (specific first)
router.post("/user-location/save", User.saveLocation);
router.get("/user-location/:userId", User.getLocationById);
router.put("/user-location/:userId", User.updateLocationById);
router.delete("/user-location/:userId", User.deleteLocationById);


// Example protected route
router.get("/profile", verifyToken, (req, res) => {
  res.json({ success: true, message: "Protected route", user: req.user });
});



export default router;
