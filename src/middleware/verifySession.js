const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = auth.split(' ')[1];

    // Shopify session tokens are signed with your app secret
    const decoded = jwt.verify(token, process.env.SHOPIFY_API_SECRET, {
      algorithms: ['HS256'],
    });

    if (!decoded?.dest || !decoded?.aud) {
      return res.status(401).json({ error: 'Invalid Shopify session token' });
    }

    if (decoded.aud !== process.env.SHOPIFY_API_KEY) {
      return res.status(401).json({ error: 'Invalid token audience' });
    }

    req.shopDomain = new URL(decoded.dest).hostname;
    req.shopifySession = decoded;

    next();
  } catch (err) {
    console.error('verifySession error:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired Shopify session token',
    });
  }
};