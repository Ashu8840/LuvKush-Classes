const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "CertificationProgram" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    title: String,
    type: {
      type: String,
      enum: ["completion", "merit"],
      default: "completion",
    },
    certificateId: { type: String, unique: true, required: true },
    issuedAt: { type: Date, default: Date.now },
    score: Number,
    percentage: Number,
    rank: Number,
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);