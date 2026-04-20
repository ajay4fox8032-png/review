const Review = require('../models/Review');
const cache = require('../utils/cache');

// ─── GET all reviews ───────────────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const { status, rating, page = 1, limit = 20 } = req.query;
    const filter = { shopDomain: req.shopDomain };
    if (status) filter.status = status;
    if (rating) filter.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(+limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.json({
      success: true,
      reviews,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('getReviews error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET single review ─────────────────────────────────────────
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      shopDomain: req.shopDomain,
    }).lean();

    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, review });
  } catch (err) {
    console.error('getReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST create review ────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const {
      productId, customerName, customerEmail,
      rating, title, reviewText, images = [],
    } = req.body;

    if (!productId || !customerName || !customerEmail || !rating)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const review = await Review.create({
      shopDomain:    req.shopDomain,
      productId,
      customerName:  customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      rating:        Math.min(5, Math.max(1, parseInt(rating))),
      title:         (title || '').trim(),
      reviewText:    (reviewText || '').trim(),
      images,
    });

    // ✅ Flush only this shop+product cache key
    cache.del(`reviews_${req.shopDomain}_${productId}`);

    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── PUT update review (safe fields only) ─────────────────────
exports.updateReview = async (req, res) => {
  try {
    // ✅ FIXED — whitelist allowed fields, never spread full req.body
    const { title, reviewText, rating, isVisible } = req.body;

    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, shopDomain: req.shopDomain },
      { title, reviewText, rating, isVisible },
      { new: true, runValidators: true }
    );

    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found' });

    cache.del(`reviews_${req.shopDomain}_${review.productId}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error('updateReview error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── DELETE review ─────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      shopDomain: req.shopDomain,
    });

    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found' });

    cache.del(`reviews_${req.shopDomain}_${review.productId}`);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('deleteReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH approve review ──────────────────────────────────────
// ✅ ADDED — dedicated approve action
exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, shopDomain: req.shopDomain },
      { status: 'approved' },
      { new: true }
    );

    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found' });

    cache.del(`reviews_${req.shopDomain}_${review.productId}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error('approveReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH reject review ───────────────────────────────────────
// ✅ ADDED — dedicated reject action
exports.rejectReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, shopDomain: req.shopDomain },
      { status: 'rejected' },
      { new: true }
    );

    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found' });

    cache.del(`reviews_${req.shopDomain}_${review.productId}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error('rejectReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH merchant reply ──────────────────────────────────────
// ✅ ADDED — merchant reply handler
exports.replyToReview = async (req, res) => {
  try {
    const { merchantReply } = req.body;

    if (!merchantReply || !merchantReply.trim())
      return res.status(400).json({ success: false, message: 'Reply text is required' });

    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, shopDomain: req.shopDomain },
      {
        merchantReply:     merchantReply.trim(),
        merchantRepliedAt: new Date(),
      },
      { new: true }
    );

    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found' });

    cache.del(`reviews_${req.shopDomain}_${review.productId}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error('replyToReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET product stats ─────────────────────────────────────────
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          shopDomain: req.shopDomain,
          productId:  req.params.productId,
          status:     'approved',
        },
      },
      {
        $group: {
          _id:          '$productId',
          avgRating:    { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          // ✅ FIXED — count per star rating instead of raw array
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ]);

    res.json({ success: true, stats: stats[0] || {} });
  } catch (err) {
    console.error('getProductStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};