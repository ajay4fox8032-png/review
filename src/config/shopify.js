const { shopifyApp } = require('@shopify/shopify-app-express');
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES?.split(','),
    hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, ''),
    apiVersion: '2024-10',
  },
  auth: { path: '/auth', callbackPath: '/auth/callback' },
  webhooks: { path: '/webhooks' },
});
module.exports = shopify;
