import VendorLogin from "../models/vendorModel.js";
import cloudinary from "../config/cloudinary.js";

// Vendor login
export const vendorLogin = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    email = email.toLowerCase().trim();

    const vendor = await VendorLogin.findOne({ email });
    if (!vendor) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Plain text comparison (for old vendors)
    if (vendor.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Vendor login successful",
      data: {
        id: vendor._id,
        email: vendor.email,
        adminId: vendor.adminId,
        shaller: vendor.shaller,
        isProfileComplete: vendor.isProfileComplete
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create vendor shaller shop
export const createVendorWithShaller = async (req, res) => {
  try {
    

    // Extract all fields from form-data and clean them
    let vendorId = req.body.vendorId;
    let shopName = req.body.shopName;
    let address = req.body.address;
    let description = req.body.description;
    let rating = req.body.rating;
    let review = req.body.review;
    let coordinates = req.body.coordinates;

    // Clean all string fields by removing quotes
    if (vendorId) vendorId = vendorId.replace(/^["']|["']$/g, '').trim();
    if (shopName) shopName = shopName.replace(/^["']|["']$/g, '').trim();
    if (address) address = address.replace(/^["']|["']$/g, '').trim();
    if (description) description = description.replace(/^["']|["']$/g, '').trim();
    if (coordinates) coordinates = coordinates.replace(/^["']|["']$/g, '').trim();


    // Validate required fields
    if (!vendorId || !shopName || !address) {
      return res.status(400).json({ 
        success: false, 
        message: "Vendor ID, shop name and address are required",
        received: { vendorId, shopName, address }
      });
    }

    // Check if vendor exists
    const vendor = await VendorLogin.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: "Vendor not found with ID: " + vendorId
      });
    }

    // Check if shop already exists for this vendor
    if (vendor.shaller && vendor.shaller.shopName) {
      return res.status(400).json({ 
        success: false, 
        message: "Shop already exists for this vendor" 
      });
    }

    // Upload image to Cloudinary if file exists
    let imageUrl = "";
    if (req.file) {
      try {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: "vendor_shaller_images"
        });
        imageUrl = uploaded.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ 
          success: false, 
          message: "Image upload failed" 
        });
      }
    }

    // Parse coordinates if they are string
    let parsedCoordinates = [0, 0];
    if (coordinates) {
      try {
        // Remove brackets and quotes, then split by comma
        const coordString = coordinates.replace(/[\[\]"']/g, '');
        parsedCoordinates = coordString.split(',').map(coord => parseFloat(coord.trim()));
      } catch (error) {
        console.error("Coordinates parsing error:", error);
        parsedCoordinates = [0, 0];
      }
    }

    // Create shaller object
    const shallerData = {
      shopName: shopName,
      address: address,
      description: description || "",
      rating: rating ? parseFloat(rating.replace(/["']/g, '')) : 0,
      review: review ? parseInt(review.replace(/["']/g, '')) : 0,
      image: imageUrl,
      location: {
        type: "Point",
        coordinates: parsedCoordinates
      },
      vendorId: vendorId
    };

    // Update vendor with shaller data
    vendor.shaller = shallerData;
    vendor.isProfileComplete = true;
    await vendor.save();

    res.status(201).json({ 
      success: true, 
      message: "Shop details created successfully", 
      data: {
        vendor: {
          id: vendor._id,
          email: vendor.email,
          adminId: vendor.adminId,
          isProfileComplete: vendor.isProfileComplete
        },
        shop: vendor.shaller
      }
    });

  } catch (error) {
    console.error("Error in createVendorWithShaller:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack
    });
  }
};

// ==================== GET ALL VENDORS ====================
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await VendorLogin.find().select("-password"); // Hide password for security

    if (!vendors || vendors.length === 0) {
      return res.status(404).json({ success: false, message: "No vendors found" });
    }

    res.status(200).json({
      success: true,
      message: "All vendors fetched successfully",
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET VENDOR BY ID ====================
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await VendorLogin.findById(id).select("-password");
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found with ID: " + id });
    }

    res.status(200).json({
      success: true,
      message: "Vendor details fetched successfully",
      data: vendor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE VENDOR BY ID ====================
export const updateVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    let vendor = await VendorLogin.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found with ID: " + id });
    }

    const {
      shopName,
      address,
      description,
      rating,
      review,
      coordinates
    } = req.body;

    // Update shaller details only if exists
    if (!vendor.shaller) vendor.shaller = {};

    if (shopName) vendor.shaller.shopName = shopName;
    if (address) vendor.shaller.address = address;
    if (description) vendor.shaller.description = description;
    if (rating) vendor.shaller.rating = parseFloat(rating);
    if (review) vendor.shaller.review = parseInt(review);

    if (coordinates) {
      try {
        const coordString = coordinates.replace(/[\[\]"']/g, '');
        vendor.shaller.location = {
          type: "Point",
          coordinates: coordString.split(',').map(coord => parseFloat(coord.trim()))
        };
      } catch (err) {
        console.error("Coordinate parsing error:", err);
      }
    }

    // If new image file provided, upload to Cloudinary
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "vendor_shaller_images"
      });
      vendor.shaller.image = uploaded.secure_url;
    }

    vendor.isProfileComplete = true;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor details updated successfully",
      data: vendor
    });
  } catch (error) {
    console.error("Error in updateVendorById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE VENDOR BY ID ====================
export const deleteVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await VendorLogin.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found with ID: " + id });
    }

    await VendorLogin.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
      deletedId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};