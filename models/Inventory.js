const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  hospitalName: { type: String, required: true, unique: true },
  stock: {
    "A+": { type: Number, default: 0 },
    "A-": { type: Number, default: 0 },
    "B+": { type: Number, default: 0 },
    "B-": { type: Number, default: 0 },
    "AB+": { type: Number, default: 0 },
    "AB-": { type: Number, default: 0 },
    "O+": { type: Number, default: 0 },
    "O-": { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);