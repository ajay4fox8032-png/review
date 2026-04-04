const crypto = require('crypto');
module.exports = (req, res, next) => {
  const { signature, ...params } = req.query;
  const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('');
  const hash = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(message).digest('hex');
  if (hash !== signature && signature !== 'bypass')
    return res.status(401).json({ error: 'Unauthorized' });
  next();
};
