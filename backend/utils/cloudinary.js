const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload un buffer ou un fichier vers Cloudinary.
 * @param {Buffer} fileBuffer - Le buffer du fichier (multer memoryStorage)
 * @param {object} options - Options Cloudinary (folder, public_id, etc.)
 * @returns {Promise<object>} Résultat Cloudinary (secure_url, public_id, etc.)
 */
function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });
}

/**
 * Supprime une ressource Cloudinary par son public_id.
 * @param {string} publicId
 * @returns {Promise<object>}
 */
function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Extrait le public_id d'une URL Cloudinary.
 * Ex: https://res.cloudinary.com/xxx/image/upload/v123/folder/file.png → folder/file
 * @param {string} url
 * @returns {string|null}
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    // Enlever le version prefix (v123456/) et l'extension
    const afterUpload = parts[1].replace(/^v\d+\//, '');
    return afterUpload.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
