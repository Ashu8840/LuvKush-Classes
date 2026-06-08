const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    qualification: String,
    experience: String,
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0 },
    subjects: [String],
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
    rating: { type: Number, default: 5 },
    performanceScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);