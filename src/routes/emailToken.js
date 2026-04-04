const { Router } = require('express');
const EmailToken = require('../models/EmailToken');
const router = Router();
router.get('/', async (req, res) => {
  const record = await EmailToken.findOne({ token: req.query.token, used: false, expiresAt: { $gt: new Date() } });
  if (!record) return res.redirect('/?error=invalid_token');
  record.used = true; await record.save();
  res.redirect(`/apps/reviews/submit-form?shop=${record.shopDomain}&product=${record.productId}&verified=email_link`);
});
module.exports = router;
