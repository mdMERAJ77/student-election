const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();
const { connectDB } = require("../config/db");

const createAdmin = async (email, password) => {
  try {
    await connectDB();
    const hashedPassword = await bcrypt.hash(password, 10); // 👈 hash password

    let user = await User.findOne({ email });
    if (user) {
      console.log("Admin already exists");
      process.exit(0);
    }

    user = new User({
      email,
      password: hashedPassword, // 👈 save hash
      role: "admin",
    });

    await user.save();
    console.log("Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};


createAdmin("admin@jietjodhpur.ac.in", "12345678");
