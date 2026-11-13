import { AppError, asyncHandler } from "../utils/allUtilities.js";
import { verifyAccessToken } from "../services/auth/tokenService.js";

/**
 * Verify Access Token Middleware
 * - Extracts token from Authorization header or auth-token header
 * - Validates JWT signature and expiration
 * - Validates MongoDB ObjectId format
 * - NO database lookup (stateless) - fast verification
 * - Sets req.person with user data
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  // Extract token from Authorization header or auth-token header
  const token =
    req.header("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ||
    req.header("auth-token");

  if (!token) {
    throw new AppError("Access denied. No token provided.", 401);
  }

  // Verify access token using tokenService
  const decoded = verifyAccessToken(token);

  // Validate MongoDB ObjectId format
  if (!/^[a-f\d]{24}$/i.test(decoded?.person?.id)) {
    throw new AppError("Invalid token format.", 401);
  }

  // Attach user info to request
  // Note: We don't do DB lookup here since token is already verified
  req.person = {
    id: decoded.person.id,
    role: decoded.person.role,
  };

  next();
});

export default verifyToken;
