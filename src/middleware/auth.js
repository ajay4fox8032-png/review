const jwt = require('jsonwebtoken');
const Shop = require('../models/Shop');

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = auth.split(' ')[1];

    const decoded = jwt.verify(token, process.env.SHOPIFY_API_SECRET);
    if (!decoded?.dest) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const shopDomain = decoded.dest.replace('https://', '');

    const shop = await Shop.findOne({ shopDomain, isActive: true });
    if (!shop) {
      return res.status(403).json({ error: 'Shop not found or inactive' });
    }

    req.shopDomain = shopDomain;
    req.shop = shop;
    next();
  } catch (err) {
    console.error('auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};