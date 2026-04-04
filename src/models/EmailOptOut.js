const mongoose = require('mongoose');
const s = new mongoose.Schema({
  shopDomain:    { type: String, required: true },
  customerEmail: { type: String, required: true },
}, { timestamps: true });
s.index({ shopDomain: 1, customerEmail: 1 }, { unique: true });
module.exports = mongoose.model('EmailOptOut', s);
