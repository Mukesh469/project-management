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

export const loginPerson = asyncHandler(async (req, res) => {
  const { source } = req.body;

  if (!source || !["admin", "manager", "employee"].includes(source)) {
    throw new AppError("Invalid or missing portal. Please use the correct login page.", 400);
  }

  const userAgent = req.get("user-agent") || "";
  const ipAddress = req.ip || "";

  const loginResult = await loginPersonService(req.body, userAgent, ipAddress);

  if (loginResult.person.role !== source) {
    throw new AppError(
      `Access denied. Your account has '${loginResult.person.role}' role, but you're trying to access the '${source}' portal. Please use the correct login page.`,
      403
    );
  }

  res.cookie("accessToken", loginResult.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/", 
  });

  res.cookie("refreshToken", loginResult.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days 
    path: "/", 
  });

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    data: {
      person: loginResult.person,
    },
  });
});

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

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully.",
    data: {
      person: {
        id: tokenData.personId,
        role: tokenData.role,
      },
    },
  });
});

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

  // Clear both cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

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

export const logoutAllDevices = asyncHandler(async (req, res) => {
  // req.person is set by verifyToken middleware
  if (!req.person?.id) {
    throw new AppError("Not authenticated", 401);
  }

  // Revoke all tokens
  const revokedCount = await revokeAllTokensForPerson(req.person.id);

  // Clear both cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

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
