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

const upload = multer({
  dest: '/tmp/',
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

router.use(verifyProxy);

// ─── GET product reviews ───────────────────────────────────────
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const shopDomain = req.query.shop;

    if (!shopDomain) {
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const sort = req.query.sort || 'newest';

    const cacheKey = `reviews:${shopDomain}:${productId}:${page}:${sort}:${req.query.rating || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const filter = {
      shopDomain,
      productId,
      status: 'approved',
      isVisible: true,
    };

    if (req.query.rating) {
      filter.rating = parseInt(req.query.rating);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
      helpful: { helpfulVotes: -1 },
    };

    const [total, reviews, stats] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.aggregate([
        {
          $match: {
            shopDomain,
            productId,
            status: 'approved',
            isVisible: true,
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const summary = stats[0] || {
      totalReviews: 0,
      avgRating: 0,
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0,
    };

    const result = {
      reviews,
      totalReviews: summary.totalReviews,
      avgRating: summary.avgRating ? +summary.avgRating.toFixed(1) : 0,
      distribution: {
        1: summary.star1,
        2: summary.star2,
        3: summary.star3,
        4: summary.star4,
        5: summary.star5,
      },
      pages: Math.ceil(total / limit),
      page,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('GET /products/:productId error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ─── POST submit review ────────────────────────────────────────
router.post('/submit', rateLimiter, upload.array('images', 5), async (req, res) => {
  try {
    const {
      shopDomain,
      productId,
      customerName,
      customerEmail,
      rating,
      title,
      reviewText,
    } = req.body;

    if (!shopDomain || !productId || !customerName || !customerEmail || !rating) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // ✅ FIXED — autoApprove now comes from Settings, not Shop
    const settings = await Settings.findOne({ shopDomain }).lean();

    const imageUrls = [];
    for (const file of req.files || []) {
      try {
        const uploadedUrl = await uploadImage(file.path, shopDomain);
        imageUrls.push(uploadedUrl);
      } catch (uploadErr) {
        console.error('Image upload failed:', uploadErr.message);
      }
    }

    const review = await Review.create({
      shopDomain,
      productId,
      customerName: sanitize(customerName).substring(0, 100),
      customerEmail: sanitize(customerEmail).substring(0, 254).toLowerCase(),
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      title: sanitize(title || '').substring(0, 200),
      reviewText: sanitize(reviewText || '').substring(0, 2000),
      images: imageUrls,
      status: settings?.autoApprove ? 'approved' : 'pending',
    });

    cache.flushAll();

    res.status(201).json({
      success: true,
      review: {
        _id: review._id,
        status: review.status,
      },
    });
  } catch (err) {
    console.error('POST /submit error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

// ─── POST helpful vote ─────────────────────────────────────────
router.post('/helpful/:reviewId', rateLimiter, async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      {
        _id: req.params.reviewId,
        status: 'approved',
        isVisible: true,
      },
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ helpfulVotes: review.helpfulVotes });
  } catch (err) {
    console.error('POST /helpful error:', err);
    res.status(500).json({ error: 'Failed to update helpful votes' });
  }
});

// ─── GET widget settings ───────────────────────────────────────
router.get('/widget-settings/:shopDomain', async (req, res) => {
  try {
    const settings = await Settings.findOne({ shopDomain: req.params.shopDomain }).lean();

    res.json(
      settings || {
        primaryColor: '#f5a623',
        starColor: '#f5a623',
        textColor: '#333333',
        layoutType: 'list',
      }
    );
  } catch (err) {
    console.error('GET /widget-settings error:', err);
    res.status(500).json({ error: 'Failed to fetch widget settings' });
  }
});

module.exports = router;