const mongoose = require("mongoose");

const parentLinkSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
      default: "guardian",
    },
  },
  { timestamps: true }
);

parentLinkSchema.index({ parent: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("ParentLink", parentLinkSchema);