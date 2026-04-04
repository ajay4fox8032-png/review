const { Router } = require('express');
const shopify = require('../config/shopify');
const router = Router();
router.get('/', shopify.auth.begin());
router.get('/callback', shopify.auth.callback(), shopify.redirectToShopifyOrAppRoot());
module.exports = router;
