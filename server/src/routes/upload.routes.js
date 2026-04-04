import { Router } from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
const upload = multer({ storage: storage });

/**
 * @route POST /api/upload
 * @desc Upload any file to Cloudinary
 * @access Private
 */
router.post("/", protect, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // req.file.path will contain the Cloudinary URL
    // req.file.filename will contain the Cloudinary public ID
    return res.status(200).json({
      message: "File uploaded successfully to cloud.",
      fileUrl: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    return res.status(500).json({ message: "Cloud upload failed.", error: error.message });
  }
});

/**
 * @route POST /api/upload/content
 * @desc Upload raw binary content or string as a file to Cloudinary
 * @access Private
 */
router.post("/content", protect, async (req, res) => {
  try {
    const { content, fileName, folder } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    const { uploadStringToCloudinary } = await import("../utils/cloudinaryUtils.js");
    const result = await uploadStringToCloudinary(content, fileName || `content_${Date.now()}.txt`, folder);

    return res.status(200).json({
      message: "Content uploaded successfully to cloud.",
      fileUrl: result.secure_url,
      publicId: result.public_id,
      originalName: fileName,
      mimeType: result.resource_type,
    });
  } catch (error) {
    return res.status(500).json({ message: "Content upload failed.", error: error.message });
  }
});

export default router;
