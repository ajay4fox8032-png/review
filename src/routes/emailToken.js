const { Router } = require('express');
const EmailToken = require('../models/EmailToken');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect('/?error=missing_token');
    }

    const record = await EmailToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.redirect('/?error=invalid_token');
    }

    record.used = true;
    record.usedAt = new Date();
    await record.save();

    return res.redirect(
      `/apps/reviews/submit-form?shop=${encodeURIComponent(
        record.shopDomain
      )}&product=${encodeURIComponent(
        record.productId
      )}&verified=email_link`
    );
  } catch (err) {
    console.error('EmailToken error:', err);
    return res.redirect('/?error=server_error');
  }
});

module.exports = router;