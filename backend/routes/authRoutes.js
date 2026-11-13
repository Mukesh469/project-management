import express from "express";
import { body } from "express-validator";
import {
  registerPerson,
  loginPerson,
  refreshAccessToken,
  logoutPerson,
  logoutAllDevices,
} from "../controllers/authController.js";
import { validate } from "../middlewares/validateFields.js";
import verifyToken from "../middlewares/verifyToken.js";
import authorizeRoles from "../middlewares/authorizeRole.js";

const router = express.Router();

const registerValidator = [
  body("name", "Name must be at least 3 characters")
    .isString().bail()
    .trim()
    .isLength({ min: 3 }),

  body("email", "Please enter a valid email")
    .isString().bail()
    .trim()
    .isEmail()
    .toLowerCase(),

  body("password", "Password must be at least 8 characters")
    .isString().bail()
    .isLength({ min: 8 })
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must be at most 72 bytes"),

  body("confirmPassword", "Passwords do not match")
    .isString().bail()
    .custom((value, { req }) => value === req.body.password),

  body("phone", "Phone must be valid")
    .isString().bail()
    .trim()
    .matches(/^[6-9]\d{9}$/),

  body("address", "Address is required").isObject({ strict: true }),

  body("address.line1", "Address Line 1 is required")
    .isString().bail()
    .trim()
    .notEmpty()
    .isLength({ min: 11 }),

  body("address.city", "City is required").isString().bail().trim().notEmpty(),
  body("address.state", "State is required").isString().bail().trim().notEmpty(),
  body("address.pincode", "Pincode must be a valid 6-digit number")
    .matches(/^[1-9][0-9]{5}$/),

  ...["line2", "locality", "country"].map((field) =>
    body(`address.${field}`, `${field} must be text`).optional().isString().bail().trim()
  ),
  body("address.geoLocation", "Geolocation must be an object")
    .optional().isObject({ strict: true }),
  body("address.geoLocation.lat", "Latitude must be between -90 and 90")
    .optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body("address.geoLocation.lng", "Longitude must be between -180 and 180")
    .optional().isFloat({ min: -180, max: 180 }).toFloat(),

  body("role", "Invalid role")
    .isString().bail()
    .trim()
    .toLowerCase()
    .isIn(["manager", "employee"]),
];

const loginValidator = [
  body("email", "Enter a valid email")
    .isString().bail()
    .trim()
    .isEmail()
    .toLowerCase(),

  body("password", "Password is required")
    .isString().bail()
    .notEmpty(),

  body("source", "Invalid or missing portal")
    .isString().bail()
    .trim()
    .toLowerCase()
    .isIn(["admin", "manager", "employee"]),
];

// Public routes (no authentication required)
router.post("/register", verifyToken, authorizeRoles("admin"), registerValidator, validate, registerPerson);
router.post("/login", loginValidator, validate, loginPerson);

// Protected routes (authentication required)
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutPerson);
router.post("/logout-all", verifyToken, logoutAllDevices);

export default router;
