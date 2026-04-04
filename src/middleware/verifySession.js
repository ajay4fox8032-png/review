const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.decode(auth.split(' ')[1]);
    req.shopDomain = decoded?.dest?.replace('https://', '');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
