const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },

  accessToken: { type: String, required: true },

  // Shop Info
  shopName:  { type: String, trim: true },
  shopEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  shopOwner: { type: String, trim: true },
  currency:  { type: String, default: 'INR' },
  timezone:  { type: String, default: 'Asia/Kolkata' },
  planName:  {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free',
  },

  // App Status
  isActive:      { type: Boolean, default: true },
  isInstalled:   { type: Boolean, default: true },
  installedAt:   { type: Date, default: Date.now },
  uninstalledAt: { type: Date, default: null },
  lastActiveAt:  { type: Date, default: Date.now },

  // ✅ REMOVED — emailEnabled, emailDelay, widgetEnabled, autoApprove
  // These now live in Settings.js only

}, { timestamps: true });

shopSchema.methods.updateActivity = function () {
  this.lastActiveAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Shop', shopSchema);