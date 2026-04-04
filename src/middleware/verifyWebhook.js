const crypto = require('crypto');
module.exports = (req, res, next) => {
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(req.body)
    .digest('base64');
  if (hash !== req.headers['x-shopify-hmac-sha256'])
    return res.status(401).send('Unauthorized');
  req.body = JSON.parse(req.body.toString());
  next();
};
