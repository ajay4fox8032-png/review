const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/auth', require('./routes/auth'));
app.use('/webhooks', require('./routes/webhooks'));
app.use('/apps/reviews', require('./routes/publicReviews'));
app.use('/reviews/verify', require('./routes/emailToken'));
app.use('/api/admin/reviews', require('./routes/adminReviews'));
app.use('/api/admin/settings', require('./routes/adminSettings'));
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
);
module.exports = app;
