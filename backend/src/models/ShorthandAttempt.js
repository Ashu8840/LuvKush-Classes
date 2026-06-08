const mongoose = require("mongoose");

const shorthandAttemptSchema = new mongoose.Schema(
  {
    dictation: { type: mongoose.Schema.Types.ObjectId, ref: "ShorthandDictation", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    typedText: { type: String, required: true },
    accuracy: { type: Number, required: true },
    wpm: { type: Number, required: true },
    mistakes: [
      {
        word: String,
        expected: String,
        typed: String,
        index: Number,
      },
    ],
    improvementFromPrevious: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    durationSeconds: { type: Number, required: true },
    insights: { type: String },
  },
  { timestamps: true }
);

shorthandAttemptSchema.index({ student: 1, dictation: 1, createdAt: -1 });

module.exports = mongoose.model("ShorthandAttempt", shorthandAttemptSchema);