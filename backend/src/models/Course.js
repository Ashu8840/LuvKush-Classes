const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, trim: true, lowercase: true },
    level: { type: String },
    description: { type: String },
    duration: { type: String },
    fee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    materials: [
      {
        title: String,
        type: { type: String, enum: ["pdf", "video", "audio", "note"] },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);