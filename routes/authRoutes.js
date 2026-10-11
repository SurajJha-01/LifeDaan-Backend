const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// 1. REGISTER API ROUTE
router.post('/register', async (req, res) => {
  try {
    const { 
      role, name, email, mobile, password, 
      bloodGroup, gender, age, weight, 
      hospitalLicense, facilityType, medicalCondition, 
      state, district, address, pincode, website
    } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) {
      return res.status(400).json({ message: "User with this Email or Mobile already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      role, name, email, mobile, password: hashedPassword,
      bloodGroup, gender, 
      age: age ? Number(age) : undefined,     
      weight: weight ? Number(weight) : undefined, 
      hospitalLicense, facilityType, medicalCondition,
      state, district, address, pincode, website: website || ""
    });

    await newUser.save();
    res.status(201).json({ message: "Registration Successful! Welcome to LifeDaan." });

  } catch (error) {
    console.error("Registration Error: ", error);
    res.status(500).json({ message: "Server error during registration!" });
  }
});

// 2. LOGIN API ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: "Account not found. Please register." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password entered." });

    // ADD: Check whether JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server configuration error."
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: "Login Successful", 
      token: token,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      lastDonationDate: user.lastDonationDate,
      user: { _id: user._id,name: user.name, role: user.role, email: user.email, pincode: user.pincode }
    });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ message: "Server error during login!" });
  }
});

// 3. DELETE ACCOUNT API ROUTE
router.delete('/delete-account/:name', async (req, res) => {
  try {
    const userName = req.params.name;
    
    const deletedUser = await User.findOneAndDelete({ name: userName });
    
    if (deletedUser && deletedUser.role === 'hospital') {
      const mongoose = require('mongoose');
      const Inventory = mongoose.models.Inventory || mongoose.model('Inventory');
      await Inventory.findOneAndDelete({ hospitalName: userName });
    }
    
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) { 
    res.status(500).json({ message: "Server error!" }); 
  }
});

// 4. GET All Donors (For Wall of Fame)
router.get('/donors', async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json(donors);
  } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

// 5. CHANGE PASSWORD ROUTE
router.put('/change-password/:email', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userEmail = req.params.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error during password update." });
  }
});

// 6. UPDATE PROFILE PICTURE ROUTE
router.put('/update-profile/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const { profilePicture } = req.body;

    await User.findOneAndUpdate(
      { email: userEmail }, 
      { profilePicture: profilePicture }, 
      { new: true, strict: false }
    );

    res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile." });
  }
});

// 🟢 RESET DONOR TIMER
router.put('/reset-timer', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { lastDonationDate: null },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Timer reset successfully! Donor is now eligible." });
  } catch (error) {
    console.error("Error resetting timer:", error);
    res.status(500).json({ message: "Server error while resetting timer." });
  }
});

module.exports = router;