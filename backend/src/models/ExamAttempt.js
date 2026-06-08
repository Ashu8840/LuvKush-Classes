const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        answer: { type: String },
        typedText: { type: String },
        isCorrect: { type: Boolean, default: false },
        marks: { type: Number, default: 0 },
        wpm: Number,
        accuracy: Number,
      },
    ],
    score: { type: Number, default: 0 },
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeTakenSeconds: { type: Number, default: 0 },
    analysis: { type: String },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated"],
      default: "in_progress",
    },
  },
  { timestamps: true }
);

examAttemptSchema.index({ exam: 1, student: 1 });
examAttemptSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);