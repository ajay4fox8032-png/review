const crypto = require('crypto');

module.exports = (req, res, next) => {
  try {
    const { signature, ...query } = req.query;

    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const sortedQuery = Object.keys(query)
      .sort()
      .map((key) => {
        const value = Array.isArray(query[key]) ? query[key].join(',') : query[key];
        return `${key}=${value}`;
      })
      .join('');

    const digest = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(sortedQuery)
      .digest('hex');

    const valid =
      digest.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(digest, 'utf8'),
        Buffer.from(signature, 'utf8')
      );

    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
  } catch (err) {
    console.error('verifyProxy error:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};