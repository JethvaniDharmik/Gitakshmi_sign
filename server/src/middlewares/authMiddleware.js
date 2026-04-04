import { User } from "../models/user.model.js";
import { verifyAccessToken } from "../utils/generateToken.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized request." });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId)
      .populate("companyId", "name isActive")
      .select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive." });
    }

    if (user.companyId && !user.companyId.isActive) {
      return res.status(403).json({ message: "Company is inactive." });
    }

    // Backward compatibility for modules still reading req.user.company
    user.company = user.companyId;

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
