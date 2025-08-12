const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('@fluidjs/multer-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to create storage
const createStorage = (folder, formats, transformation) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: formats,
      transformation,
    },
  });
};

// Storages
const storage = createStorage('clickopticx', ['jpeg', 'jpg', 'png', 'gif', 'webp'], [
  { width: 500, height: 500, crop: 'limit' },
]);

const promotionStorage = createStorage('clickopticx/promotions', ['jpeg', 'jpg', 'png', 'gif', 'webp'], [
  { quality: 'auto:best', fetch_format: 'auto', width: 1920, height: 1080, crop: 'limit' },
]);

const logoStorage = createStorage('clickopticx/nav', ['jpeg', 'jpg', 'png', 'svg', 'webp'], [
  { quality: 'auto:best', fetch_format: 'auto', width: 800, height: 400, crop: 'limit' },
]);

const sliderStorage = createStorage('clickopticx/sliders', ['jpeg', 'jpg', 'png', 'gif', 'webp'], [
  { quality: 'auto:best', fetch_format: 'auto', width: 1920, height: 1080, crop: 'limit' },
]);

// Multer upload configs
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPromotion = multer({ storage: promotionStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadLogo = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadSlider = multer({ storage: sliderStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = {
  cloudinary,
  upload,
  uploadPromotion,
  uploadLogo,
  uploadSlider,
};
