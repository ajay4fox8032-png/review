const nodemailer = require('nodemailer');
const EmailToken = require('../models/EmailToken');
const generateToken = require('../utils/generateToken');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendReviewRequest = async ({ shopDomain, customerEmail, customerName, productId, productTitle, orderId }) => {
  const token = generateToken();
  await EmailToken.create({ shopDomain, orderId, customerEmail, productId, token });
  const reviewUrl = `${process.env.SHOPIFY_APP_URL}/reviews/verify?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `How was your ${productTitle}?`,
    html: `<p>Hi ${customerName},</p>
           <p>Thank you for your purchase! We'd love to hear your feedback.</p>
           <p><a href="${reviewUrl}" style="background:#f5a623;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Write a Review</a></p>`,
  });
};
module.exports = { sendReviewRequest };
