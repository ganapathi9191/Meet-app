import mongoose from "mongoose";

// Shaller Shop schema
const shallerSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String },
  rating: { type: Number, default: 0 },
  review: { type: Number, default: 0 },
  image: { type: String }, // Cloudinary image URL
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorLogin", required: true }, // Vendor reference

  // Admin review fields
  lastEditedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  reviewHistory: {
    review: Number,
    rating: Number,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    editedAt: { type: Date, default: Date.now }}
    
}, { timestamps: true });

const vendorLoginSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, trim: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  shaller: shallerSchema, // Each vendor can have one shaller shop
}, { timestamps: true });

const VendorLogin = mongoose.models.VendorLogin || mongoose.model("VendorLogin", vendorLoginSchema);
export default VendorLogin;
