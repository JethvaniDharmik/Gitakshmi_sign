import { Router } from "express";
import {
  createCompany,
  getAllDocuments,
  getAllUsers,
  getCompanies,
  updateCompany,
} from "../controllers/superAdmin.controller.js";
import { authorizeRoles, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect, authorizeRoles(ROLES.SUPER_ADMIN));

router.post("/companies", createCompany);
router.get("/companies", getCompanies);
router.patch("/companies/:companyId", updateCompany);
router.get("/users", getAllUsers);
router.get("/documents", getAllDocuments);

export default router;
