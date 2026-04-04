import { Router } from "express";
import {
  getAssignedDocuments,
  getSigningWorkspace,
  signAssignedDocument,
  streamAssignedDocumentFile,
  submitSigningFields,
} from "../controllers/user.controller.js";
import { authorizeRoles, protect, requireCompanyContext } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(
  protect,
  requireCompanyContext,
  authorizeRoles(ROLES.COMPANY_ADMIN, ROLES.HR, ROLES.EMPLOYEE)
);

router.get("/documents/assigned", getAssignedDocuments);
router.get("/documents/:documentId/workspace", getSigningWorkspace);
router.get("/documents/:documentId/file", streamAssignedDocumentFile);
router.post("/documents/:documentId/submit-fields", submitSigningFields);
router.post("/documents/:documentId/sign", signAssignedDocument);

export default router;
