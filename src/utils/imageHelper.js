/**
 * Helper function to generate proper image URLs
 * Handles both Cloudinary URLs and legacy local paths
 */
function getImageUrl(imagePath, fallbackImage = '/images/profile-1740414577370.webp') {
  if (!imagePath) {
    return fallbackImage;
  }
  
  // If it's already a full URL (Cloudinary), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a legacy local path, add /uploads/ prefix
  return '/uploads/' + imagePath;
}

module.exports = { getImageUrl };