const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== MULTIPLE UPLOAD CONFIGURATIONS FOR DIFFERENT PURPOSES =====

// Standard storage (for general uploads) - Keep current size limit
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clickopticx',
    allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// High-quality storage for promotions - No size limit, preserve quality
const promotionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clickopticx/promotions',
    allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ 
      quality: 'auto:best',
      fetch_format: 'auto',
      width: 1920,
      height: 1080,
      crop: 'limit'
    }],
  },
});

// Logo storage - High quality, appropriate size
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clickopticx/nav',
    allowedFormats: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
    transformation: [{ 
      quality: 'auto:best',
      fetch_format: 'auto',
      width: 800,
      height: 400,
      crop: 'limit'
    }],
  },
});

// Slider storage - High quality for slider images
const sliderStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clickopticx/sliders',
    allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ 
      quality: 'auto:best',
      fetch_format: 'auto',
      width: 1920,
      height: 1080,
      crop: 'limit'
    }],
  },
});

// Standard upload (existing)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// High-quality promotion upload
const uploadPromotion = multer({
  storage: promotionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for promotions
});

// Logo upload
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for logos
});

// Slider upload
const uploadSlider = multer({
  storage: sliderStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for sliders
});

module.exports = { 
  cloudinary, 
  upload,           // Standard upload (existing)
  uploadPromotion,  // High-quality for promotions
  uploadLogo,       // Optimized for logos
  uploadSlider      // High-quality for sliders
};


