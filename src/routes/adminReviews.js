const { Router } = require('express');
const verifySession = require('../middleware/verifySession');
const Review = require('../models/Review');
const cache = require('../utils/cache');
const controller = require('../controllers/reviewController');

const router = Router();

// All admin review routes require a valid Shopify session
router.use(verifySession);

// ─── LIST & CRUD (delegate to controller) ─────────────────────

// List reviews (with filters, pagination)
router.get('/', controller.getReviews);

// Get single review
router.get('/:id', controller.getReview);

// Create review manually (if you support admin-created reviews)
router.post('/', controller.createReview);

// Update review fields (title, text, rating, visibility)
router.put('/:id', controller.updateReview);

// Delete review
router.delete('/:id', controller.deleteReview);

// Approve / reject
router.patch('/:id/approve', controller.approveReview);
router.patch('/:id/reject', controller.rejectReview);

// Merchant reply
router.post('/:id/reply', controller.replyToReview);

// Product-level stats (for a given product)
router.get('/stats/product/:productId', controller.getProductStats);

// ─── GLOBAL STATS (keep your aggregate logic, just isolated) ──

router.get('/stats', async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { shopDomain: req.shopDomain } },
      {
        $group: {
          _id:       null,
          total:     { $sum: 1 },
          approved:  { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending:   { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, 1, 0] } },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const s = stats[0] || { total: 0, approved: 0, pending: 0, avgRating: 0 };

    res.json({
      total:        s.total,
      approved:     s.approved,
      pending:      s.pending,
      avgRating:    s.avgRating ? +s.avgRating.toFixed(1) : 0,
      approvalRate: s.total ? Math.round((s.approved / s.total) * 100) : 0,
    });
  } catch (err) {
    console.error('GET /api/admin/reviews/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── BULK ACTIONS ─────────────────────────────────────────────

router.patch('/bulk', async (req, res) => {
  try {
    const { ids, action } = req.body;

    if (!ids?.length || !action) {
      return res.status(400).json({ error: 'Missing ids or action' });
    }

    const filter = { _id: { $in: ids }, shopDomain: req.shopDomain };

    if (action === 'delete') {
      await Review.deleteMany(filter);
    } else if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await Review.updateMany(filter, { $set: { status: newStatus } });
    } else {
      return res.status(400).json({ error: 'Invalid bulk action' });
    }

    // More targeted cache clear would be ideal, but this is acceptable for now
    cache.flushAll();

    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/reviews/bulk error:', err);
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

module.exports = router;