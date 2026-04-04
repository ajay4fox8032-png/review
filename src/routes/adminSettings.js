const { Router } = require('express');
const verifySession = require('../middleware/verifySession');
const Settings = require('../models/Settings');
const router = Router();
router.use(verifySession);
router.get('/',  async (req, res) => { const s = await Settings.findOne({ shopDomain: req.shopDomain }).lean() || {}; res.json({ settings: s }); });
router.post('/', async (req, res) => { const s = await Settings.findOneAndUpdate({ shopDomain: req.shopDomain }, { ...req.body, shopDomain: req.shopDomain }, { upsert: true, new: true }); res.json({ settings: s }); });
module.exports = router;
