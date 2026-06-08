const express = require("express");
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getExamResults,
  getExamEvaluation,
  submitResult,
} = require("../controllers/examController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getExams);
router.get("/my-attempts", protect, authorize("student"), getMyAttempts);
router.get("/:id/evaluation", protect, authorize("admin", "teacher"), getExamEvaluation);
router.get("/:id/results", protect, authorize("admin", "teacher"), getExamResults);
router.get("/:id", protect, getExamById);
router.post("/", protect, authorize("admin", "teacher"), createExam);
router.put("/:id", protect, authorize("admin", "teacher"), updateExam);
router.delete("/:id", protect, authorize("admin"), deleteExam);
router.post("/:id/start", protect, authorize("student"), startAttempt);
router.post("/:id/submit", protect, authorize("student"), submitAttempt);
router.post("/:examId/submit-result", protect, authorize("student"), submitResult);

module.exports = router;