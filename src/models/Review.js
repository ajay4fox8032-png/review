const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  shopDomain:    { type: String, required: true, index: true, trim: true },
  productId:     { type: String, required: true, index: true, trim: true },
  orderId:       { type: String, default: null },

  customerName:  { type: String, required: true, maxlength: 100, trim: true },
  customerEmail: {
    type: String,
    required: true,
    maxlength: 254,
    lowercase: true,
    trim: true,
    // ✅ ADDED — basic email format validation
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },

  rating:     { type: Number, required: true, min: 1, max: 5 },
  title:      { type: String, maxlength: 200, trim: true, default: '' },
  reviewText: { type: String, maxlength: 2000, trim: true },
  images: {
    type: [String],
    validate: [
      {
        validator: arr => arr.length <= 5,
        message: 'Max 5 images allowed',
      },
      {
        // ✅ ADDED — basic URL validation for each image
        validator: arr => arr.every(url => /^https?:\/\/.+/.test(url)),
        message: 'Each image must be a valid URL',
      },
    ],
  },

  status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  isVisible: { type: Boolean, default: true },
  isVerified:{ type: Boolean, default: false },

  merchantReply:     { type: String, maxlength: 1000, default: null },
  merchantRepliedAt: { type: Date, default: null }, // ✅ ADDED — track reply time

  // ✅ FIXED — min: 0 so votes can't go negative
  helpfulVotes: { type: Number, default: 0, min: 0 },

}, { timestamps: true });

// ✅ ADDED — compound indexes for faster queries
reviewSchema.index({ shopDomain: 1, productId: 1 });
reviewSchema.index({ shopDomain: 1, status: 1 });
reviewSchema.index({ shopDomain: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);