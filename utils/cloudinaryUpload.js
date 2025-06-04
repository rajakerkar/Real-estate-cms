const cloudinary = require('../config/cloudinary');
const fs = require('fs');

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} folder - Folder in Cloudinary to upload to
 * @returns {Promise} - Promise that resolves to the Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, folder = 'real-estate') => {
  try {
    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    // Remove the file from local storage after upload
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    // If there's an error, remove the file from local storage
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

module.exports = {
  uploadToCloudinary
};
