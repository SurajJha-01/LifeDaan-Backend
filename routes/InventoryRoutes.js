const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// 🟢 1. GET INVENTORY
router.get('/:hospitalName', async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    let inv = await Inventory.findOne({ hospitalName });

    if (!inv) {
      inv = new Inventory({ 
        hospitalName, 
        stock: { 
          "A+": 0, "A-": 0, "B+": 0, "B-": 0, 
          "AB+": 0, "AB-": 0, "O+": 0, "O-": 0 
        } 
      });
      await inv.save();
    }
    res.status(200).json(inv.stock);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching inventory." });
  }
});

// 🟢 2. UPDATE INVENTORY
router.put('/update', async (req, res) => {
  try {
    const { hospitalName, bloodGroup, change } = req.body;
    let inv = await Inventory.findOne({ hospitalName });

    if (inv) {
      inv.stock[bloodGroup] = Math.max(0, inv.stock[bloodGroup] + change);
      await inv.save();
      res.status(200).json(inv.stock);
    } else {
      res.status(404).json({ message: "Inventory not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error updating inventory." });
  }
});

module.exports = router;