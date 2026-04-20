const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const generateReviewUrl = (token) => {
  return `${process.env.SHOPIFY_APP_URL}/reviews/verify?token=${token}`;
};

const generateOptOutUrl = (shopDomain, email) => {
  return `${process.env.SHOPIFY_APP_URL}/reviews/optout?shop=${shopDomain}&email=${encodeURIComponent(email)}`;
};

module.exports = { isValidEmail, generateReviewUrl, generateOptOutUrl };