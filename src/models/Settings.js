const mongoose = require('mongoose');
const settingsSchema = new mongoose.Schema({
  shopDomain:    { type: String, required: true, unique: true },
  primaryColor:  { type: String, default: '#f5a623' },
  starColor:     { type: String, default: '#f5a623' },
  textColor:     { type: String, default: '#333333' },
  layoutType:    { type: String, default: 'list' },
  autoApprove:   { type: Boolean, default: false },
  autoSendEmail: { type: Boolean, default: true },
  emailDelay:    { type: Number, default: 7 },
}, { timestamps: true });
module.exports = mongoose.model('Settings', settingsSchema);
