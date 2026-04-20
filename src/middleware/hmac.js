const crypto = require('crypto');

module.exports = (req, res, next) => {
  try {
    const { hmac, ...params } = req.query;
    if (!hmac) {
      return res.status(401).json({ error: 'Missing HMAC' });
    }

    const message = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const digest = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(message)
      .digest('hex');

    if (digest !== hmac) {
      return res.status(401).json({ error: 'Invalid HMAC' });
    }

    next();
  } catch (err) {
    console.error('hmac error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};