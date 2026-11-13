import { asyncHandler, AppError } from "../utils/allUtilities.js";
import { loginPersonService, registerPersonService } from "../services/auth/authService.js";
import { verifyRefreshToken, revokeRefreshToken, revokeAllTokensForPerson } from "../services/auth/tokenService.js";
import { generateAccessToken } from "../services/auth/tokenService.js";

export const registerPerson = asyncHandler(async (req, res) => {
  const person = await registerPersonService(req.body);

  res.status(201).json({
    success: true,
    message: "Person registered successfully.",
    data: person,
  });
});

/**
 * Login controller
 * Sets refresh token in httpOnly cookie
 * Returns access token in response body
 * Validates that user role matches requested portal
 */
export const loginPerson = asyncHandler(async (req, res) => {
  const { source } = req.body;

  // Validate portal/source is provided
  if (!source || !["admin", "manager", "employee"].includes(source)) {
    throw new AppError("Invalid or missing portal. Please use the correct login page.", 400);
  }

  // device info for security tracking
  const userAgent = req.get("user-agent") || "";
  const ipAddress = req.ip || "";

  const loginResult = await loginPersonService(req.body, userAgent, ipAddress);

  // Validate role matches the requested portal
  if (loginResult.person.role !== source) {
    throw new AppError(
      `Access denied. Your account has '${loginResult.person.role}' role, but you're trying to access the '${source}' portal. Please use the correct login page.`,
      403
    );
  }

  // Set refresh token in httpOnly cookie
  // httpOnly = JavaScript cannot access
  // secure = Only sent over HTTPS in production
  // sameSite = Prevents CSRF attacks
  res.cookie("refreshToken", loginResult.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/", // Available to all routes
  });

  // Return access token in body (client stores in memory)
  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    data: {
      accessToken: loginResult.accessToken,
      person: loginResult.person,
    },
  });
});

/**
 * Refresh Token endpoint
 * Takes refresh token from cookie
 * Returns new access token and person data
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from httpOnly cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token is required. Please login again.", 401);
  }

  // Verify refresh token and get user info
  const tokenData = await verifyRefreshToken(refreshToken);

  // Generate new access token
  const newAccessToken = generateAccessToken(tokenData.personId, tokenData.role);

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully.",
    data: {
      accessToken: newAccessToken,
      person: {
        id: tokenData.personId,
        role: tokenData.role,
      },
    },
  });
});

/**
 * Logout controller
 * Revokes refresh token (removes from DB)
 * Clears cookie
 */
export const logoutPerson = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      // Revoke the refresh token
      const tokenData = await verifyRefreshToken(refreshToken);
      await revokeRefreshToken(tokenData.tokenId);
    } catch (err) {
      // If token is already invalid, just proceed with logout
      console.log("Token already invalid:", err.message);
    }
  }

  // Clear cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

/**
 * Logout from all devices
 * Revokes all refresh tokens for this person
 */
export const logoutAllDevices = asyncHandler(async (req, res) => {
  // req.person is set by verifyToken middleware
  if (!req.person?.id) {
    throw new AppError("Not authenticated", 401);
  }

  // Revoke all tokens
  const revokedCount = await revokeAllTokensForPerson(req.person.id);

  // Clear cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: `Logged out from ${revokedCount} device(s).`,
  });
});
