import Admin from "../models/admin.js";
import VendorLogin from "../models/vendorModel.js";
import bcrypt from "bcrypt";

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { adminName, email, password } = req.body;

    if (!adminName || !email || !password) {
      return res.status(400).json({ success: false, message: "Admin name, email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Compare plain password with hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Check adminName
    if (admin.adminName !== adminName.trim()) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        id: admin._id,
        adminName: admin.adminName,
        email: admin.email,
        vendors: admin.vendors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin creates vendor
export const createVendor = async (req, res) => {
  try {
    const { adminId, name, email, phoneNumber, password } = req.body;

    if (!adminId || !name || !email || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Find the admin creating the vendor
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    // Check if vendor email already exists
    const emailExists = admin.vendors.find(v => v.email === email);
    if (emailExists) return res.status(400).json({ success: false, message: "Vendor email already exists" });

    // Add vendor to admin's vendor array
    const vendor = { name, email, phoneNumber, password };
    admin.vendors.push(vendor);
    await admin.save();

    // Add vendor to login schema
    await VendorLogin.create({ email, password, adminId: admin._id });

    res.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Admin adds or edits vendor shop review (without array)
export const addOrEditVendorReview = async (req, res) => {
  try {
    const { adminId, vendorId, review, rating } = req.body;

    if (!adminId || !vendorId || review === undefined || rating === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "adminId, vendorId, review, and rating are required" 
      });
    }

    // Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    // Find vendor
    const vendor = await VendorLogin.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    // Check if vendor has a shop
    if (!vendor.shaller) {
      return res.status(400).json({ success: false, message: "Vendor does not have a shop yet" });
    }

    // Update admin reviewHistory only
    vendor.shaller.reviewHistory = {
      review: parseInt(review),
      rating: parseFloat(rating),
      editedBy: admin._id,
      editedAt: new Date()
    };

    // Optionally store who last edited by admin
    vendor.shaller.lastEditedByAdmin = admin._id;

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Admin review updated successfully",
      data: {
        vendorId: vendor._id,
        shopName: vendor.shaller.shopName,
        vendorReview: vendor.shaller.review,         // original vendor review
        vendorRating: vendor.shaller.rating,         // original vendor rating
        adminReviewHistory: vendor.shaller.reviewHistory,
        lastEditedByAdmin: vendor.shaller.lastEditedByAdmin
      }
    });

  } catch (error) {
    console.error("Error in addOrEditVendorReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};