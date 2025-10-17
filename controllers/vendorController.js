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
    let workingstatus = req.body.workingstatus;
    let coordinates = req.body.coordinates;

    // Clean all string fields
    if (vendorId) vendorId = vendorId.replace(/^["']|["']$/g, '').trim();
    if (shopName) shopName = shopName.replace(/^["']|["']$/g, '').trim();
    if (address) address = address.replace(/^["']|["']$/g, '').trim();
    if (description) description = description.replace(/^["']|["']$/g, '').trim();
    if (workingstatus) workingstatus = workingstatus.replace(/^["']|["']$/g, '').trim();
    if (coordinates) coordinates = coordinates.replace(/^["']|["']$/g, '').trim();

    // Validate required fields
    if (!vendorId || !shopName || !address) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID, shop name and address are required",
        received: { vendorId, shopName, address, workingstatus }
      });
    }

    // Check vendor existence
    const vendor = await VendorLogin.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found with ID: " + vendorId
      });
    }

    // Prevent duplicate shop creation
    if (vendor.shaller && vendor.shaller.shopName) {
      return res.status(400).json({
        success: false,
        message: "Shop already exists for this vendor"
      });
    }

    // Upload image to Cloudinary
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

    // Parse coordinates
    let parsedCoordinates = [0, 0];
    if (coordinates) {
      try {
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
      workingstatus: workingstatus || "OPEN", // ✅ Added workingstatus here
      image: imageUrl,
      location: {
        type: "Point",
        coordinates: parsedCoordinates
      },
      vendorId: vendorId
    };

    // Save shaller data
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
    const vendors = await VendorLogin.find().select("-password");
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
      workingstatus,
      coordinates
    } = req.body;

    if (!vendor.shaller) vendor.shaller = {};

    if (shopName) vendor.shaller.shopName = shopName;
    if (address) vendor.shaller.address = address;
    if (description) vendor.shaller.description = description;
    if (rating) vendor.shaller.rating = parseFloat(rating);
    if (review) vendor.shaller.review = parseInt(review);
    if (workingstatus) vendor.shaller.workingstatus = workingstatus; // ✅ Added here
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

export const updateWorkingStatus = async (req, res) => {
  try {
    const { id } = req.params; // Vendor ID
    let { workingstatus } = req.body; // Expected: "OPEN" or "CLOSED"

    // Validate workingstatus
    if (!workingstatus || !["OPEN", "CLOSED"].includes(workingstatus.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "workingstatus is required and must be either 'OPEN' or 'CLOSED'"
      });
    }

    const vendor = await VendorLogin.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (!vendor.shaller) {
      return res.status(400).json({ success: false, message: "Vendor does not have a shaller shop" });
    }

    // Update workingstatus
    vendor.shaller.workingstatus = workingstatus.toUpperCase();
    await vendor.save();

    res.status(200).json({
      success: true,
      message: `Working status updated to '${vendor.shaller.workingstatus}'`,
      data: { vendorId: vendor._id, workingstatus: vendor.shaller.workingstatus }
    });

  } catch (error) {
    console.error("Error updating working status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==================== GET ALL SHALLERS BY CATEGORY ====================
export const getShallersByCategory = async (req, res) => {
  try {
    // Fetch all vendors who have shaller data
    const vendors = await VendorLogin.find({ shaller: { $exists: true, $ne: null } });

    // Initialize category arrays
    const bestShallers = [];
    const recommendedShallers = [];
    const peopleMoreLike = [];

    vendors.forEach(vendor => {
      const shop = vendor.shaller;

      if (!shop || !shop.shopName) return;

      const rating = shop.rating || 0;
      const review = shop.review || 0;

      // 🏆 Best Shallers: Rating between 4.6 - 5.0
      if (rating >= 4.6 && rating <= 5.0) {
        bestShallers.push({
          vendorId: vendor._id,
          shopName: shop.shopName,
          rating,
          review,
          category: "Best Shaller",
          image: shop.image,
          workingstatus: shop.workingstatus
        });
      }

      // ⭐ Recommended Shallers: Rating between 4.1 - 4.5
      if (rating >= 4.1 && rating <= 4.5) {
        recommendedShallers.push({
          vendorId: vendor._id,
          shopName: shop.shopName,
          rating,
          review,
          category: "Recommended Shaller",
          image: shop.image,
          workingstatus: shop.workingstatus
        });
      }

      // ❤️ People More Like Shallers: Review > 90
      if (review > 90) {
        peopleMoreLike.push({
          vendorId: vendor._id,
          shopName: shop.shopName,
          rating,
          review,
          category: "People More Like",
          image: shop.image,
          workingstatus: shop.workingstatus
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Shallers fetched successfully",
      totalVendors: vendors.length,
      data: {
        bestShallers,
        recommendedShallers,
        peopleMoreLike
      }
    });

  } catch (error) {
    console.error("Error in getShallersByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};