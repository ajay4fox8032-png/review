const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  shopDomain:     { type: String, required: true, index: true },
  productId:      { type: String, required: true, index: true },
  orderId:        String,
  customerName:   { type: String, required: true, maxlength: 100 },
  customerEmail:  { type: String, required: true, maxlength: 254 },
  rating:         { type: Number, required: true, min: 1, max: 5 },
  reviewText:     { type: String, maxlength: 2000 },
  images:         [String],
  isVerified:     { type: Boolean, default: false },
  status:         { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },
  isVisible:      { type: Boolean, default: true },
  merchantReply:  { type: String, maxlength: 1000 },
  helpfulVotes:   { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Review', reviewSchema);
