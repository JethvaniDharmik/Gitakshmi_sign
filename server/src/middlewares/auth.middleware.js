import { authMiddleware } from "./authMiddleware.js";
import { roleMiddleware } from "./roleMiddleware.js";

export const protect = authMiddleware;
export const authorizeRoles = (...roles) => roleMiddleware(...roles);

export const requireCompanyContext = (req, res, next) => {
  if (!req.user?.companyId) {
    return res.status(400).json({ message: "This action requires a company user account." });
  }
  return next();
};

export { authMiddleware, roleMiddleware };
