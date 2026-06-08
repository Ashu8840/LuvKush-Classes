const mongoose = require("mongoose");

const librarySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ["pdf", "video", "audio", "note", "paper"],
      required: true,
    },
    category: {
      type: String,
      enum: ["shorthand", "typing", "computer", "ccc", "general"],
      default: "general",
    },
    url: { type: String, required: true },
    visibility: {
      type: String,
      enum: ["public", "course"],
      default: "public",
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [String],
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Library", librarySchema);