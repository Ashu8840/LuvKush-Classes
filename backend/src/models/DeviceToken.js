const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    platform: {
      type: String,
      enum: ["web", "android", "ios"],
      required: true,
    },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ user: 1, token: 1 }, { unique: true });

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);