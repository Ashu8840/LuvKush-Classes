const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["morning", "evening", "weekend"],
      required: true,
    },
    timing: { type: String, required: true },
    strength: { type: Number, default: 30 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", batchSchema);