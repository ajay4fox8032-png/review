const Review = require('../models/Review');

// GET all reviews (with filters)
exports.getReviews = async (req, res) => {
  try {
    const { productId, shopDomain, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (shopDomain) filter.shopDomain = shopDomain;
    if (status) filter.status = status;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      reviews
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single review
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create review
exports.createReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update review
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET average rating for a product
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { productId: req.params.productId, status: 'approved' } },
      { $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingBreakdown: { $push: '$rating' }
      }}
    ]);
    res.json({ success: true, stats: stats[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};