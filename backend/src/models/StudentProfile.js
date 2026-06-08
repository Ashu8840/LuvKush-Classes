const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dateOfBirth: Date,
    address: String,
    parentName: String,
    parentPhone: String,
    aadhaarNumber: String,
    admissionDate: { type: Date, default: Date.now },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    feesStatus: {
      type: String,
      enum: ["paid", "pending", "partial", "overdue"],
      default: "pending",
    },
    totalFees: { type: Number, default: 0 },
    paidFees: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },
    attendancePercent: { type: Number, default: 0 },
    documents: [{ name: String, url: String, uploadedAt: Date }],
    streak: { type: Number, default: 0 },
    badges: [String],
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastPracticeDate: { type: Date },
    practiceHistory: [
      {
        date: { type: Date, default: Date.now },
        wpm: Number,
        accuracy: Number,
        type: { type: String, enum: ["typing", "shorthand", "exam"] },
      },
    ],
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);