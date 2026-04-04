import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createTeamMember,
  createWorkflow,
  getCompanyDocuments,
  getCompanyUsers,
  getCompanyWorkflows,
  uploadDocument,
} from "../controllers/companyAdmin.controller.js";
import { authorizeRoles, protect, requireCompanyContext } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    cb(null, `${Date.now()}-${safeBase || "document"}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed."));
      return;
    }

    cb(null, true);
  },
});

router.use(
  protect,
  requireCompanyContext,
  authorizeRoles(ROLES.COMPANY_ADMIN, ROLES.HR)
);

router.post("/users", createTeamMember);
router.get("/users", getCompanyUsers);
router.post("/documents", upload.single("document"), uploadDocument);
router.get("/documents", getCompanyDocuments);
router.post("/workflows", createWorkflow);
router.get("/workflows", getCompanyWorkflows);

export default router;
