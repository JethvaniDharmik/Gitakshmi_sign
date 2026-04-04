import { Router } from "express";
import {
  getSignRequestByToken,
  previewDocumentByToken,
  signDocumentByToken,
} from "../controllers/signature.controller.js";

const router = Router();

router.get("/:token", getSignRequestByToken);
router.get("/:token/preview", previewDocumentByToken);
router.post("/:token/sign", signDocumentByToken);

export default router;
