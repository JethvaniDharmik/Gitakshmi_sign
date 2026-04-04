import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";

/**
 * Upload a local file to Cloudinary.
 * @param {string} localFilePath - Path of the file on the local file system.
 * @param {string} folder - Folder name in Cloudinary.
 * @returns {Promise<object>} Cloudinary upload result.
 */
export const uploadToCloudinary = async (localFilePath, folder = "gitakshmi-sign") => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: "auto", // Automatically detect file type
    });

    // Remove file from local storage after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result;
  } catch (error) {
    // Also remove the local file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

/**
 * Upload a string content as a raw file to Cloudinary.
 * @param {string} content - String content (e.g. text/JSON/markdown).
 * @param {string} fileName - Destination filename in Cloudinary.
 * @param {string} folder - Folder name.
 * @returns {Promise<object>} Cloudinary upload result.
 */
export const uploadStringToCloudinary = async (content, fileName, folder = "gitakshmi-sign") => {
  try {
    // Stream upload from string might be more complex, simpler way:
    // Create a temporary file and upload it.
    const tempPath = `./tmp_${Date.now()}_${fileName}`;
    fs.writeFileSync(tempPath, content);
    
    const result = await uploadToCloudinary(tempPath, folder);
    return result;
  } catch (error) {
    console.error("Cloudinary string upload error:", error);
    throw error;
  }
};
