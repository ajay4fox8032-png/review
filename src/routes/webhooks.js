const { Router } = require('express');
const verifyWebhook = require('../middleware/verifyWebhook');
const Review = require('../models/Review');
const EmailQueue = require('../models/EmailQueue');
const Settings = require('../models/Settings');
const router = Router();

router.post('/orders/fulfilled', verifyWebhook, async (req, res) => {
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];
  const settings = await Settings.findOne({ shopDomain: shop });
  if (!settings?.autoSendEmail) return res.sendStatus(200);
  const delayMs = (settings.emailDelay || 7) * 24 * 60 * 60 * 1000;
  for (const item of order.line_items || []) {
    await EmailQueue.create({
      shopDomain: shop, orderId: String(order.id),
      customerEmail: order.email, customerName: order.customer?.first_name || 'Customer',
      productId: String(item.product_id), productTitle: item.title,
      scheduledAt: new Date(Date.now() + delayMs),
    });
  }
  res.sendStatus(200);
});

router.post('/customers/data_request', verifyWebhook, (req, res) => res.sendStatus(200));

router.post('/customers/redact', verifyWebhook, async (req, res) => {
  await Review.updateMany(
    { shopDomain: req.headers['x-shopify-shop-domain'], customerEmail: req.body.customer?.email },
    { $set: { customerName: '[Deleted]', customerEmail: 'redacted@deleted.com' } }
  );
  res.sendStatus(200);
});

router.post('/shop/redact', verifyWebhook, async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  await Promise.all([
    Review.deleteMany({ shopDomain: shop }),
    Settings.deleteOne({ shopDomain: shop }),
    EmailQueue.deleteMany({ shopDomain: shop }),
  ]);
  res.sendStatus(200);
});
module.exports = router;
