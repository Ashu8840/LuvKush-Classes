const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["mock", "weekly", "monthly", "final"],
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "typing", "shorthand", "practical"],
      required: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 100 },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
        marks: { type: Number, default: 1 },
        dictationAudio: String,
        targetWpm: Number,
      },
    ],
    isPublished: { type: Boolean, default: false },
    isTimed: { type: Boolean, default: true },
    results: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: Number,
        wpm: Number,
        accuracy: Number,
        rank: Number,
        evaluatedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);