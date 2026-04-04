const { Router } = require('express');
const verifySession = require('../middleware/verifySession');
const Review = require('../models/Review');
const cache = require('../utils/cache');
const router = Router();
router.use(verifySession);

router.get('/', async (req, res) => {
  const { status, rating, page = 1, limit = 20 } = req.query;
  const filter = { shopDomain: req.shopDomain };
  if (status) filter.status = status;
  if (rating) filter.rating = parseInt(rating);
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean(),
    Review.countDocuments(filter),
  ]);
  res.json({ reviews, total, pages: Math.ceil(total / limit) });
});

router.get('/stats', async (req, res) => {
  const reviews = await Review.find({ shopDomain: req.shopDomain }).lean();
  const total = reviews.length;
  const approved = reviews.filter(r => r.status === 'approved').length;
  const pending  = reviews.filter(r => r.status === 'pending').length;
  const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;
  res.json({ total, approved, pending, avgRating: +avg, approvalRate: total ? Math.round(approved/total*100) : 0 });
});

router.patch('/bulk', async (req, res) => {
  const { ids, action } = req.body;
  if (action === 'delete') await Review.deleteMany({ _id: { $in: ids }, shopDomain: req.shopDomain });
  else await Review.updateMany({ _id: { $in: ids }, shopDomain: req.shopDomain }, { $set: { status: action === 'approve' ? 'approved' : 'rejected' } });
  cache.flushAll(); res.json({ success: true });
});

router.patch('/:id/status',     async (req, res) => { const r = await Review.findOneAndUpdate({ _id: req.params.id, shopDomain: req.shopDomain }, { status: req.body.status }, { new: true }); cache.flushAll(); res.json({ review: r }); });
router.patch('/:id/visibility', async (req, res) => { const r = await Review.findOneAndUpdate({ _id: req.params.id, shopDomain: req.shopDomain }, { isVisible: req.body.isVisible }, { new: true }); cache.flushAll(); res.json({ review: r }); });
router.delete('/:id',           async (req, res) => { await Review.findOneAndDelete({ _id: req.params.id, shopDomain: req.shopDomain }); cache.flushAll(); res.json({ success: true }); });
router.post('/:id/reply',       async (req, res) => { const r = await Review.findOneAndUpdate({ _id: req.params.id, shopDomain: req.shopDomain }, { merchantReply: req.body.reply }, { new: true }); cache.flushAll(); res.json({ review: r }); });
module.exports = router;
