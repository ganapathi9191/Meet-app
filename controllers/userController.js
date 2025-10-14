import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import cloudinary from "../config/cloudinary.js";


const OTP_CODE = "1234";
const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES || 1;

// -------------------- Send OTP --------------------
// ---------------- OTP ----------------
export const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) return res.status(400).json({ success: false, message: "Mobile number required" });

    let user = await User.findOne({ mobileNumber });
    if (!user) user = new User({ mobileNumber });

    user.otp = OTP_CODE;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    const token = jwt.sign({ mobileNumber }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.status(200).json({ success: true, message: "OTP sent", otp: OTP_CODE, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp, token } = req.body;
    if (!otp || !token) return res.status(400).json({ success: false, message: "OTP and token required" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const { mobileNumber } = decoded;
    const user = await User.findOne({ mobileNumber });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (new Date() > user.otpExpiresAt) return res.status(400).json({ success: false, message: "OTP expired" });

    user.isVerified = true;
    await user.save();

    // Create a new token valid for further actions (optional)
    const verifiedToken = jwt.sign({ mobileNumber, userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ 
      success: true, 
      message: "OTP verified", 
      token: verifiedToken,
      userId: user._id  // ✅ send userId here
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// GET user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};




//-------------------- Save live location-------------------------------


export const saveLocation = async (req, res) => {
   try {
    const { userId, latitude, longitude } = req.body;
    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "userId, latitude and longitude required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.location = { type: "Point", coordinates: [longitude, latitude] };
    await user.save();

    res.status(200).json({ success: true, message: "Location saved", location: user.location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET location by userId
export const getLocationById = async (req, res) => {
 try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, location: user.location || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE location by userId
export const updateLocationById = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined)
      return res.status(400).json({ success: false, message: "userId, latitude and longitude required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.location = { type: "Point", coordinates: [longitude, latitude], updatedAt: new Date() };
    await user.save();

    res.status(200).json({ success: true, message: "Location updated", location: user.location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE location by userId
export const deleteLocationById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.location = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Location deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};







//-----------------------personal info-----------------------


// -------------------- Personal Info --------------------
// -------------------- CREATE --------------------
export const createOrUpdatePersonalInfo = async (req, res) => {
  try {
    const { mobileNumber, fullName, email } = req.body;
    if (!mobileNumber) return res.status(400).json({ success: false, message: "Mobile number required" });

    const user = await User.findOne({ mobileNumber });
    if (!user || !user.isVerified) return res.status(400).json({ success: false, message: "User must verify OTP first" });

    let imageUrl = user.personalInfo?.image || "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user-profile",
        use_filename: true,
        unique_filename: false
      });
      imageUrl = result.secure_url;
    }

    user.personalInfo = {
      fullName: fullName || user.personalInfo?.fullName,
      email: email || user.personalInfo?.email,
      image: imageUrl
    };

    await user.save();
    res.status(200).json({ success: true, message: "Personal info saved", data: user.personalInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllPersonalInfos = async (req, res) => {
  try {
    const users = await User.find({}, { personalInfo: 1, mobileNumber: 1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPersonalInfoById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, { personalInfo: 1, mobileNumber: 1 });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      data: {
        mobileNumber: user.mobileNumber,
        ...user.personalInfo?._doc // spread fields from personalInfo subdocument
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePersonalInfoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email } = req.body;

    const user = await User.findById(id);
    if (!user || !user.isVerified) return res.status(400).json({ success: false, message: "User must verify OTP first" });

    let imageUrl = user.personalInfo?.image || "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user-profile",
        use_filename: true,
        unique_filename: false
      });
      imageUrl = result.secure_url;
    }

    user.personalInfo = {
      fullName: fullName || user.personalInfo?.fullName,
      email: email || user.personalInfo?.email,
      image: imageUrl
    };

    await user.save();
    res.status(200).json({ success: true, message: "Personal info updated", data: user.personalInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePersonalInfoById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.personalInfo = undefined; // ✅ removes the whole subdocument
    await user.save();

    res.status(200).json({ success: true, message: "Personal info deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};