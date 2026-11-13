
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import Admin from "./models/Admin.js";
import Person from "./models/Person.js";
import { AppError } from "./utils/allUtilities.js";

export const seedAdmin = async (env = process.env, { repairLegacy = false } = {}) => {
    const email = env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = env.ADMIN_PASSWORD;

    if (!env.MONGO_URI || !email || !password) {
        throw new AppError("Configure MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD first.", 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError("ADMIN_EMAIL must be a valid email address.", 400);
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72 ||
        !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$/.test(password)) {
        throw new AppError("ADMIN_PASSWORD must be at least 8 characters, at most 72 bytes, and include letters, numbers and a special character.", 400);
    }

    try {
        await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        const existing = await Person.findOne({ email });

        if (existing) {
            if (existing.role === "admin") {
                return "Admin already exists. No account was changed.";
            }
            if (existing.role) {
                throw new AppError("Email belongs to a non-admin account. No account was changed.", 409);
            }
            if (!repairLegacy) {
                throw new AppError("Account has no role. Run npm run seed:admin -- --repair-legacy-admin to repair the original seed account.", 409);
            }
            if (!existing.password || !(await bcrypt.compare(password, existing.password))) {
                throw new AppError("ADMIN_PASSWORD must match the existing account before its role can be repaired.", 403);
            }
            const result = await Person.updateOne(
                { _id: existing._id, role: null },
                { $set: { role: "admin" } },
                { overwriteDiscriminatorKey: true, runValidators: true }
            );
            if (result.modifiedCount !== 1) {
                throw new AppError("Account changed during repair. Check its current role before retrying.", 409);
            }
            return "Seed account repaired: role is now admin. Password unchanged.";
        }

        await Admin.init();
        await Admin.create({
            name: env.ADMIN_NAME?.trim() || "Administration",
            email,
            password: await bcrypt.hash(password, 10),
            address: {
                line1: "F-212 Lado Sarai",
                city: "New Delhi",
                state: "Delhi",
                country: "India",
                pincode: "110030"
            }
        });
        return "Admin created successfully with role: admin in the people collection.";
    } finally {
        await mongoose.disconnect();
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    dotenv.config({ path: new URL(".env", import.meta.url), quiet: true });
    try {
        console.log(await seedAdmin(process.env, {
            repairLegacy: process.argv.includes("--repair-legacy-admin")
        }));
    } catch (error) {
        const message = error instanceof AppError ? error.message
            : error.code === 11000 ? "Email already exists. No account was changed."
                : "Check MongoDB connectivity and seed configuration.";
        console.error(`Admin seed failed: ${message}`);
        process.exitCode = 1;
    }
}