import { verifyToken } from "../services/tokenService.js";
import { User } from "../models/user.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "NO_TOKEN",
      message: "Please log in to continue",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "TOKEN_INVALID",
      message: "Your session has expired, please log in again",
    });
  }

  try {
    const account = await User.findById(req.userId).select("isBlocked").lean();

    if (!account) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        message: "Account not found",
      });
    }

    if (account.isBlocked) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_BLOCKED",
        message: "Your account has been blocked. Please contact support.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify account",
    });
  }
};

export const attachUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        message: "Account not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load account",
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized for this action",
    });
  }
  next();
};