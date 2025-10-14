import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import bcrypt from "bcrypt";           // 🔹 Required for hashing default password
import Admin from "./models/admin.js"; // 🔹 Must import Admin before usage

import userRoute from "./routes/userRoute.js";
import category from "./routes/categoryRoute.js";
import admin from "./routes/adminRoute.js";
import vendor from "./routes/vendorRoute.js"



dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB and create default admin
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Create default admin if not exists
    const existingAdmin = await Admin.findOne({ email: "admin123@gmail.com" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      const defaultAdmin = new Admin({
        adminName: "Varma",
        email: "admin123@gmail.com",
        password: hashedPassword
      });
      await defaultAdmin.save();
      console.log("✅ Default admin created: admin123@gmail.com / Admin@123");
    }
  })
  .catch(err => console.error("Mongo Error:", err.message));

// Socket.IO
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Socket disconnected:", socket.id));
});

// Routes
app.use("/api", userRoute);
app.use("/api", category);
app.use("/api", admin);
app.use("/api",vendor);

// Server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
