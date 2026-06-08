const mongoose = require("mongoose");

const certificationAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "CertificationProgram", required: true },
    questionIndices: [{ type: Number }],
    answers: [
      {
        questionIndex: Number,
        answer: String,
        isCorrect: Boolean,
      },
    ],
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
    },
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
    submittedAt: Date,
  },
  { timestamps: true }
);

certificationAttemptSchema.index({ student: 1, program: 1, createdAt: -1 });

module.exports = mongoose.model("CertificationAttempt", certificationAttemptSchema);