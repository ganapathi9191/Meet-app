import mongoose from "mongoose";

const vendorSubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true } // plain password
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  adminName: { type: String, required: true, trim: true }, // ✅ added adminName
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  vendors: [vendorSubSchema]
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export default Admin;
