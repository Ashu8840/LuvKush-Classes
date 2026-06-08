const mongoose = require("mongoose");

const typingPassageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    language: {
      type: String,
      enum: ["english", "hindi"],
      required: true,
    },
    wordCount: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    category: { type: String, default: "general", trim: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

typingPassageSchema.pre("save", function (next) {
  if (this.content) {
    this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
  }
  next();
});

module.exports = mongoose.model("TypingPassage", typingPassageSchema);