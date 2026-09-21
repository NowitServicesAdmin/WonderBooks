import { verifyToken } from "../services/tokenService.js";
import { User } from "../models/user.js";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired, please log in again",
    });
  }
};

// Loads the full User document onto req.user. Use AFTER requireAuth on any
// route that needs more than just the id - subscription routes need
// req.user.role / .email / .name, for example. Kept separate from
// requireAuth so cheap routes that only need the id aren't paying for an
// extra DB hit.
export const attachUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
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

// Use AFTER requireAuth + attachUser. Blocks anyone who isn't a super
// admin - this is what protects plan pricing/editing and the
// all-users subscription view.
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized for this action",
    });
  }
  next();
};
