const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow Shopify app URL + localhost for dev
app.use(cors({
  origin: [
    process.env.SHOPIFY_APP_URL,
    'http://localhost:5173', // Vite dev server
  ],
  credentials: true,
}));

// ✅ Raw body MUST come before express.json() for webhooks
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Body parsers for everything else
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔐 Optional rate limiting (NOT on /webhooks)
app.use('/auth', rateLimiter);
app.use('/api/admin', rateLimiter);
app.use('/apps/reviews', rateLimiter);

// ✅ Health check
app.get('/', (req, res) => {
  res.json({
    message: '✅ Shopify Reviews App API is running!',
    version: '1.0.0',
  });
});

// Routes
app.use('/auth',                require('./routes/auth'));
app.use('/webhooks',            require('./routes/webhooks'));
app.use('/apps/reviews',        require('./routes/publicReviews'));
app.use('/reviews/verify',      require('./routes/emailToken'));
app.use('/api/admin/reviews',   require('./routes/adminReviews'));
app.use('/api/admin/settings',  require('./routes/adminSettings'));

// Serve React frontend (production)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// SPA fallback — exclude API-style routes
app.get(/^\/(?!api|auth|webhooks|apps|reviews\/verify).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: '❌ Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: '❌ Internal server error' });
});

module.exports = app;