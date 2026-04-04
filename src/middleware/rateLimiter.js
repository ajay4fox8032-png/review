const rateLimit = require('express-rate-limit');
module.exports = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later.' },
});
