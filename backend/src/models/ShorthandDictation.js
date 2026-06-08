const mongoose = require("mongoose");

const shorthandDictationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    audioUrl: { type: String, required: true },
    transcript: { type: String, required: true },
    targetWpm: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShorthandDictation", shorthandDictationSchema);