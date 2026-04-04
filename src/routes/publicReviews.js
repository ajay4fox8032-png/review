const { Router } = require('express');
const multer = require('multer');
const verifyProxy = require('../middleware/verifyProxy');
const rateLimiter = require('../middleware/rateLimiter');
const Review = require('../models/Review');
const Settings = require('../models/Settings');
const { uploadImage } = require('../services/cloudinaryService');
const sanitize = require('../utils/sanitize');
const cache = require('../utils/cache');
const router = Router();
const upload = multer({ dest: '/tmp/', limits: { fileSize: 5 * 1024 * 1024, files: 5 } });
router.use(verifyProxy);

router.get('/products/:productId', async (req, res) => {
  const { productId } = req.params;
  const shopDomain = req.query.shop;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const sort = req.query.sort || 'newest';
  const cacheKey = `reviews:${shopDomain}:${productId}:${page}:${sort}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  const filter = { shopDomain, productId, status: 'approved', isVisible: true };
  if (req.query.rating) filter.rating = parseInt(req.query.rating);
  const sortMap = { newest: { createdAt: -1 }, highest: { rating: -1 }, lowest: { rating: 1 } };
  const [total, reviews, all] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort(sortMap[sort] || sortMap.newest).skip((page-1)*10).limit(10).lean(),
    Review.find({ shopDomain, productId, status: 'approved', isVisible: true }).lean(),
  ]);
  const avgRating = all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1) : 0;
  const result = { reviews, totalReviews: all.length, avgRating: +avgRating, pages: Math.ceil(total/10), page };
  cache.set(cacheKey, result);
  res.json(result);
});

router.post('/submit', rateLimiter, upload.array('images', 5), async (req, res) => {
  const { shopDomain, productId, customerName, customerEmail, rating, reviewText } = req.body;
  if (!shopDomain || !productId || !customerName || !customerEmail || !rating)
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  const settings = await Settings.findOne({ shopDomain });
  const imageUrls = [];
  for (const file of req.files || []) {
    try { imageUrls.push(await uploadImage(file.path, shopDomain)); } catch {}
  }
  const review = await Review.create({
    shopDomain, productId,
    customerName:  sanitize(customerName).substring(0, 100),
    customerEmail: sanitize(customerEmail).substring(0, 254),
    rating: Math.min(5, Math.max(1, parseInt(rating))),
    reviewText: sanitize(reviewText).substring(0, 2000),
    images: imageUrls,
    status: settings?.autoApprove ? 'approved' : 'pending',
  });
  cache.flushAll();
  res.json({ success: true, review: { _id: review._id, status: review.status } });
});

router.post('/helpful/:reviewId', async (req, res) => {
  const r = await Review.findByIdAndUpdate(req.params.reviewId, { $inc: { helpfulVotes: 1 } }, { new: true });
  res.json({ helpfulVotes: r?.helpfulVotes || 0 });
});

router.get('/widget-settings/:shopDomain', async (req, res) => {
  const s = await Settings.findOne({ shopDomain: req.params.shopDomain }).lean();
  res.json(s || { primaryColor: '#f5a623', starColor: '#f5a623', textColor: '#333333', layoutType: 'list' });
});
module.exports = router;
