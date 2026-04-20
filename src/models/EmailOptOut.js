const mongoose = require('mongoose');

const emailOptOutSchema = new mongoose.Schema(
  {
    shopDomain: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
  },
  { timestamps: true }
);

// One opt-out record per shop + email combination
emailOptOutSchema.index(
  { shopDomain: 1, customerEmail: 1 },
  { unique: true }
);

module.exports = mongoose.model('EmailOptOut', emailOptOutSchema);