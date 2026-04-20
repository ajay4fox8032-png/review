const crypto = require('crypto');

module.exports = (req, res, next) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];

    if (!hmac) {
      return res.status(401).send('Unauthorized');
    }

    const rawBody = req.body;

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      return res.status(401).send('Unauthorized');
    }

    const digest = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(rawBody)
      .digest('base64');

    const valid =
      digest.length === hmac.length &&
      crypto.timingSafeEqual(
        Buffer.from(digest, 'utf8'),
        Buffer.from(hmac, 'utf8')
      );

    if (!valid) {
      return res.status(401).send('Unauthorized');
    }

    req.body = JSON.parse(rawBody.toString('utf8'));

    next();
  } catch (err) {
    console.error('verifyWebhook error:', err.message);
    return res.status(401).send('Unauthorized');
  }
};