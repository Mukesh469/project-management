import jwt from "jsonwebtoken";
import crypto from "crypto";
import TokenRefresh from "../../models/TokenRefresh.js";
import { AppError } from "../../utils/allUtilities.js";


export const generateAccessToken = (personId, role) => {
  if (!personId || !role) {
    throw new AppError("personId and role are required", 500);
  }

  return jwt.sign(
    { person: { id: personId, role } },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

export const generateRefreshToken = async (personId, userAgent = "", ipAddress = "") => {
  if (!personId) {
    throw new AppError("personId is required", 500);
  }

  const expiryDays = 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const tokenString = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto.createHash("sha256").update(tokenString).digest("hex");

  const tokenRecord = await TokenRefresh.create({
    person: personId,
    token: hashedToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  return {
    token: tokenString,
    expiresAt,
    tokenId: tokenRecord._id,
  };
};

export const verifyRefreshToken = async (token) => {
  if (!token) {
    throw new AppError("Refresh token is required", 401);
  }

  try {
    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find token in database
    const tokenRecord = await TokenRefresh.findOne({
      token: hashedToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() }, // Not expired
    }).populate("person", "_id role");

    if (!tokenRecord) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    return {
      personId: tokenRecord.person._id,
      role: tokenRecord.person.role,
      tokenId: tokenRecord._id,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid refresh token", 401);
  }
};

export const revokeRefreshToken = async (tokenId) => {
  if (!tokenId) {
    throw new AppError("tokenId is required", 500);
  }

  const result = await TokenRefresh.findByIdAndUpdate(
    tokenId,
    { isRevoked: true },
    { new: true }
  );

  if (!result) {
    throw new AppError("Token not found", 404);
  }

  return true;
};

export const revokeAllTokensForPerson = async (personId) => {
  if (!personId) {
    throw new AppError("personId is required", 500);
  }

  const result = await TokenRefresh.updateMany(
    { person: personId },
    { isRevoked: true }
  );

  return result.modifiedCount;
};

export const verifyAccessToken = (token) => {
  if (!token) {
    throw new AppError("Access token is required", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });

    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Access token expired", 401);
    }
    if (err.name === "JsonWebTokenError") {
      throw new AppError("Invalid access token", 401);
    }
    throw new AppError("Token verification failed", 401);
  }
};
