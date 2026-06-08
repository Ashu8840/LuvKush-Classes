const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: {
      type: String,
      enum: ["general", "course", "teacher", "facilities", "app", "fees", "other", "contact"],
      default: "general",
    },
    rating: { type: Number, min: 1, max: 5 },
    subject: { type: String, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    isTestimonial: { type: Boolean, default: false },
    approvedForHomepage: { type: Boolean, default: false },
    isContactInquiry: { type: Boolean, default: false },
    contactName: { type: String, trim: true, maxlength: 80 },
    contactEmail: { type: String, trim: true, maxlength: 120 },
    contactPhone: { type: String, trim: true, maxlength: 20 },
    contactStatus: {
      type: String,
      enum: ["new", "contacted", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ isTestimonial: 1, approvedForHomepage: 1 });
feedbackSchema.index({ isContactInquiry: 1, contactStatus: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);