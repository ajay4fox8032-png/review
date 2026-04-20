const nodemailer = require('nodemailer');
const EmailToken = require('../models/EmailToken');
const generateToken = require('../utils/generateToken');
const {
  isValidEmail,
  generateReviewUrl,
  generateOptOutUrl,
} = require('../utils/emailHelper');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP connection failed:', err.message);
  } else {
    console.log('✅ SMTP ready');
  }
});

const sendReviewRequest = async ({
  shopDomain,
  customerEmail,
  customerName,
  productId,
  productTitle,
  orderId,
}) => {
  if (!isValidEmail(customerEmail)) {
    throw new Error(`Invalid email: ${customerEmail}`);
  }

  const token = generateToken();

  await EmailToken.create({
    shopDomain,
    orderId,
    customerEmail,
    productId,
    token,
  });

  const reviewUrl = generateReviewUrl(token);
  const optOutUrl = generateOptOutUrl(shopDomain, customerEmail);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: customerEmail,
    subject: `How was your ${productTitle}?`,
    html: `
      <p>Hi ${customerName || 'Customer'},</p>
      <p>Thank you for your purchase! We'd love to hear your feedback on <strong>${productTitle}</strong>.</p>
      <p>
        <a href="${reviewUrl}" style="background:#f5a623;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
          Write a Review
        </a>
      </p>
      <p style="font-size:12px;color:#999;margin-top:24px">
        Don't want review emails?
        <a href="${optOutUrl}" style="color:#999">Unsubscribe</a>
      </p>
    `,
  });
};

module.exports = { sendReviewRequest };