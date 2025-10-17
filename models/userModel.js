import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  addressType: { type: String, required: true }, // e.g., "Home", "Work"
  lat: { type: Number }, // optional
  lng: { type: Number }, // optional
  fullAddress: { type: String } // optional
});

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

  personalInfo: personalInfoSchema,

  // ✅ Address array added here
  addresses: [addressSchema]
});

// Geospatial index
userSchema.index({ location: "2dsphere" });

export const User = mongoose.model("User", userSchema);
