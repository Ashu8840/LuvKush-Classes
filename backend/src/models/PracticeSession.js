const mongoose = require("mongoose");

const practiceSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["typing", "shorthand", "exam"],
      required: true,
    },
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    language: { type: String, enum: ["english", "hindi", ""], default: "" },
    passage: { type: mongoose.Schema.Types.ObjectId, ref: "TypingPassage" },
    durationSeconds: { type: Number, default: 0 },
    errorKeys: [
      {
        key: { type: String },
        count: { type: Number, default: 1 },
      },
    ],
    xpEarned: { type: Number, default: 0 },
    practicedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

practiceSessionSchema.index({ student: 1, practicedAt: -1 });

module.exports = mongoose.model("PracticeSession", practiceSessionSchema);