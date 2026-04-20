const { Router } = require('express');
const shopify = require('../config/shopify');
const Shop = require('../models/Shop');

const router = Router();

// Start OAuth
router.get('/', async (req, res) => {
  try {
    const shop = (req.query.shop || '').trim().toLowerCase();

    if (!shop) {
      return res.status(400).send('Missing shop parameter');
    }

    await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).send('Auth failed');
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { shop, accessToken } = callback.session;
    const host = req.query.host || '';

    await Shop.findOneAndUpdate(
      { shopDomain: shop },
      {
        shopDomain: shop,
        accessToken,
        isInstalled: true,
        isActive: true,
        installedAt: new Date(),
        uninstalledAt: null,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const redirectUrl = `${process.env.SHOPIFY_APP_URL}/?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('Auth callback error:', err);
    res.status(500).send('Auth failed');
  }
});

module.exports = router;