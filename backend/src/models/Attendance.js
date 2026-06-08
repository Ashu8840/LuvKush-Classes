const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      default: "present",
    },
    method: {
      type: String,
      enum: ["manual", "qr", "face", "biometric"],
      default: "manual",
    },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);