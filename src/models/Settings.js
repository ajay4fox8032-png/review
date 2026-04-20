const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopDomain: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },

  // ✅ Widget Appearance
  primaryColor: { 
    type: String, 
    default: '#f5a623',
    match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color'],
  },
  starColor: { 
    type: String, 
    default: '#f5a623',
    match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color'],
  },
  textColor: { 
    type: String, 
    default: '#333333',
    match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color'],
  },
  layoutType: { 
    type: String, 
    enum: ['list', 'grid', 'masonry'], 
    default: 'list' 
  },

  // ✅ ADDED — Display Settings
  reviewsPerPage:   { type: Number, default: 10, min: 1, max: 50 },
  defaultSortOrder: { 
    type: String, 
    enum: ['newest', 'oldest', 'highest', 'lowest', 'helpful'], 
    default: 'newest' 
  },
  minRatingToShow:  { type: Number, default: 1, min: 1, max: 5 },
  showPhotosOnly:   { type: Boolean, default: false },
  showVerifiedOnly: { type: Boolean, default: false },

  // ✅ ADDED — Review Submission Settings
  autoApprove:         { type: Boolean, default: false },
  allowImages:         { type: Boolean, default: true },
  maxImages:           { type: Number, default: 5, min: 1, max: 10 },
  requireTitle:        { type: Boolean, default: false },
  requireReviewText:   { type: Boolean, default: true },
  minReviewLength:     { type: Number, default: 10, min: 0, max: 100 },

  // ✅ ADDED — Email Notification Settings
  emailEnabled:           { type: Boolean, default: true },
  emailDelay:             { type: Number, default: 7, min: 1, max: 30 },
  emailSubject:           { type: String, default: 'How was your order? Leave a review!', maxlength: 200 },
  sendMerchantNotification: { type: Boolean, default: true },

  // ✅ ADDED — Widget Display Toggles
  widgetEnabled:       { type: Boolean, default: true },
  showRatingSummary:   { type: Boolean, default: true },
  showReviewCount:     { type: Boolean, default: true },
  showVerifiedBadge:   { type: Boolean, default: true },
  showHelpfulVotes:    { type: Boolean, default: true },
  showMerchantReply:   { type: Boolean, default: true },

}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);