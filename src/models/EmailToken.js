const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema({
  shopDomain:    { type: String, required: true, index: true, trim: true },
  orderId:       { type: String, required: true, trim: true },
  customerEmail: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  productId:     { type: String, required: true, trim: true },

  // Token lookup
  token:         { type: String, required: true, unique: true, index: true },

  // Usage tracking
  used:          { type: Boolean, default: false },
  usedAt:        { type: Date, default: null },

  // TTL — auto delete after 30 days
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },

}, { timestamps: true });

// TTL index — MongoDB auto-deletes expired tokens
emailTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailToken', emailTokenSchema);