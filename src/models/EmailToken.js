const mongoose = require('mongoose');
const s = new mongoose.Schema({
  shopDomain:    String,
  orderId:       String,
  customerEmail: String,
  productId:     String,
  token:         { type: String, unique: true },
  used:          { type: Boolean, default: false },
  expiresAt:     { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) },
}, { timestamps: true });
module.exports = mongoose.model('EmailToken', s);
