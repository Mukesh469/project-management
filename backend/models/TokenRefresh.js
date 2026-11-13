import mongoose from "mongoose";

const { Schema } = mongoose;

const TokenRefreshSchema = new Schema(
  {
    person: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    isRevoked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for efficient logout across all devices
TokenRefreshSchema.index({ person: 1, isRevoked: 1 });

export default mongoose.model("TokenRefresh", TokenRefreshSchema);
