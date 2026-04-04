const mongoose = require('mongoose');
const s = new mongoose.Schema({
  shopDomain:    String,
  orderId:       String,
  customerEmail: String,
  customerName:  String,
  productId:     String,
  productTitle:  String,
  scheduledAt:   { type: Date, required: true },
  sent:          { type: Boolean, default: false },
  sentAt:        Date,
}, { timestamps: true });
module.exports = mongoose.model('EmailQueue', s);
