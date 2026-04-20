const { Router } = require('express');
const verifyWebhook = require('../middleware/verifyWebhook');
const Review = require('../models/Review');
const EmailQueue = require('../models/EmailQueue');
const Settings = require('../models/Settings');
const Shop = require('../models/Shop');

const router = Router();

// ORDER FULFILLED → queue review email
router.post('/orders/fulfilled', verifyWebhook, async (req, res) => {
  try {
    const order = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'];

    if (!shopDomain || !order) {
      return res.sendStatus(400);
    }

    const settings = await Settings.findOne({ shopDomain }).lean();

    if (!settings?.emailEnabled || !order.email) {
      return res.sendStatus(200);
    }

    const delayDays = settings.emailDelay || 7;
    const delayMs = delayDays * 24 * 60 * 60 * 1000;
    const scheduledAt = new Date(Date.now() + delayMs);

    const customerName =
      order.customer?.first_name ||
      order.customer?.name ||
      'Customer';

    const tasks = [];

    for (const item of order.line_items || []) {
      if (!item?.product_id) continue;

      tasks.push(
        EmailQueue.create({
          shopDomain,
          orderId: String(order.id),
          customerEmail: order.email,
          customerName,
          productId: String(item.product_id),
          productTitle: item.title || 'Product',
          scheduledAt,
        })
      );
    }

    await Promise.all(tasks);

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook /orders/fulfilled error:', err);
    return res.sendStatus(500);
  }
});

// APP UNINSTALLED
router.post('/app/uninstalled', verifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];

    if (!shopDomain) {
      return res.sendStatus(400);
    }

    await Shop.findOneAndUpdate(
      { shopDomain },
      {
        isActive: false,
        isInstalled: false,
        uninstalledAt: new Date(),
      }
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook /app/uninstalled error:', err);
    return res.sendStatus(500);
  }
});

// GDPR: customer data request
router.post('/customers/data_request', verifyWebhook, async (req, res) => {
  try {
    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook /customers/data_request error:', err);
    return res.sendStatus(500);
  }
});

// GDPR: customer redact
router.post('/customers/redact', verifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const email = req.body.customer?.email;

    if (!shopDomain || !email) {
      return res.sendStatus(400);
    }

    await Review.updateMany(
      { shopDomain, customerEmail: email },
      {
        $set: {
          customerName: '[Deleted]',
          customerEmail: 'redacted@deleted.com',
        },
      }
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook /customers/redact error:', err);
    return res.sendStatus(500);
  }
});

// GDPR: shop redact
router.post('/shop/redact', verifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];

    if (!shopDomain) {
      return res.sendStatus(400);
    }

    await Promise.all([
      Review.deleteMany({ shopDomain }),
      Settings.deleteOne({ shopDomain }),
      EmailQueue.deleteMany({ shopDomain }),
      Shop.findOneAndUpdate(
        { shopDomain },
        {
          isActive: false,
          isInstalled: false,
          uninstalledAt: new Date(),
        }
      ),
    ]);

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook /shop/redact error:', err);
    return res.sendStatus(500);
  }
});

module.exports = router;