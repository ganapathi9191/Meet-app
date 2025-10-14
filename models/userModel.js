import mongoose from "mongoose";

const personalInfoSchema = new mongoose.Schema({
  fullName: { type: String },
  email: { type: String },
  image: { type: String }
});

const userSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  isVerified: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  personalInfo: personalInfoSchema
});

// Geospatial index
userSchema.index({ location: "2dsphere" });

export const User = mongoose.model("User", userSchema);
