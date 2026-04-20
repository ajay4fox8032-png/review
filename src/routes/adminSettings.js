const { Router } = require('express');
const verifySession = require('../middleware/verifySession');
const Settings = require('../models/Settings');

const router = Router();

router.use(verifySession);

// GET settings for current shop
router.get('/', async (req, res) => {
  try {
    const settings =
      (await Settings.findOne({ shopDomain: req.shopDomain }).lean()) || {};

    res.json({ settings });
  } catch (err) {
    console.error('GET /api/admin/settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// SAVE / UPDATE settings (whitelisted fields only)
router.post('/', async (req, res) => {
  try {
    const {
      // appearance
      primaryColor,
      starColor,
      textColor,
      layoutType,

      // display
      reviewsPerPage,
      defaultSortOrder,
      minRatingToShow,
      showPhotosOnly,
      showVerifiedOnly,

      // submission
      autoApprove,
      allowImages,
      maxImages,
      requireTitle,
      requireReviewText,
      minReviewLength,

      // email
      emailEnabled,
      emailDelay,
      emailSubject,
      sendMerchantNotification,

      // widget toggles
      widgetEnabled,
      showRatingSummary,
      showReviewCount,
      showVerifiedBadge,
      showHelpfulVotes,
      showMerchantReply,
    } = req.body;

    const update = {
      shopDomain: req.shopDomain,
      primaryColor,
      starColor,
      textColor,
      layoutType,
      reviewsPerPage,
      defaultSortOrder,
      minRatingToShow,
      showPhotosOnly,
      showVerifiedOnly,
      autoApprove,
      allowImages,
      maxImages,
      requireTitle,
      requireReviewText,
      minReviewLength,
      emailEnabled,
      emailDelay,
      emailSubject,
      sendMerchantNotification,
      widgetEnabled,
      showRatingSummary,
      showReviewCount,
      showVerifiedBadge,
      showHelpfulVotes,
      showMerchantReply,
    };

    // remove undefined keys so we don’t overwrite with undefined
    Object.keys(update).forEach(
      (key) => update[key] === undefined && delete update[key]
    );

    if (Object.keys(update).length <= 1) {
      // only shopDomain present
      return res.status(400).json({ error: 'No settings data provided' });
    }

    const settings = await Settings.findOneAndUpdate(
      { shopDomain: req.shopDomain },
      update,
      { upsert: true, new: true }
    );

    res.json({ settings });
  } catch (err) {
    console.error('POST /api/admin/settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;