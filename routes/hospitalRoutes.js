const express = require('express');
const router = express.Router();
const User = require('../models/User'); 

// 🟢 GET ALL REGISTERED HOSPITALS
router.get('/list', async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital' }).select('-password');
    res.status(200).json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ message: "Server error fetching hospitals" });
  }
});

module.exports = router;