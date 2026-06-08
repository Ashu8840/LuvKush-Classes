const express = require("express");
const {
  submitFeedback,
  submitContactInquiry,
  getAdminFeedback,
  getPublicTestimonials,
  toggleTestimonialApproval,
  updateContactStatus,
  deleteFeedback,
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/public/testimonials", getPublicTestimonials);
router.post("/public/contact", submitContactInquiry);
router.post("/", protect, authorize("student"), submitFeedback);
router.get("/", protect, authorize("admin"), getAdminFeedback);
router.patch("/:id/homepage", protect, authorize("admin"), toggleTestimonialApproval);
router.patch("/:id/contact-status", protect, authorize("admin"), updateContactStatus);
router.delete("/:id", protect, authorize("admin"), deleteFeedback);

module.exports = router;