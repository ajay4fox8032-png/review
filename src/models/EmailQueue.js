const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema(
  {
    shopDomain: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    orderId: {
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

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    productId: {
      type: String,
      required: true,
      trim: true,
    },

    productTitle: {
      type: String,
      required: true,
      trim: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },

    sent: {
      type: Boolean,
      default: false,
      index: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// fetch unsent emails per shop
emailQueueSchema.index({ shopDomain: 1, sent: 1 });

// cron job queries: next emails to send
emailQueueSchema.index({ scheduledAt: 1, sent: 1 });

module.exports = mongoose.model('EmailQueue', emailQueueSchema);