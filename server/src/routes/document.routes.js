import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  deleteDocument,
  getAuditTrail,
  getDocumentById,
  getMyDocuments,
  sendSignRequest,
  streamDocumentFile,
  uploadDocument,
} from "../controllers/document.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);
    cb(null, `${Date.now()}-${safeBase || "document"}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed."));
      return;
    }
    cb(null, true);
  },
});

router.post("/upload", protect, upload.single("document"), uploadDocument);
router.get("/", protect, getMyDocuments);
router.get("/:id", protect, getDocumentById);
router.get("/:id/file", protect, streamDocumentFile);
router.get("/:id/audit", protect, getAuditTrail);
router.post("/:id/request-sign", protect, sendSignRequest);
router.delete("/:id", protect, deleteDocument);

export default router;
