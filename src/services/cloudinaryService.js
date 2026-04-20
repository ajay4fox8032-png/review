const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, shopDomain) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `shopify-reviews/${shopDomain}`,
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });
    return result.secure_url;
  } finally {
    fs.unlink(filePath, () => {}); // ✅ always clean up temp file
  }
};

module.exports = { uploadImage };