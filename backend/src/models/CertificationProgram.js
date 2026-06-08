const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
  },
  { _id: true }
);

const certificationProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    pdfUrl: String,
    youtubeUrl: String,
    questions: [questionSchema],
    questionsPerExam: { type: Number, default: 10, min: 1 },
    passingPercent: { type: Number, default: 65, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificationProgram", certificationProgramSchema);