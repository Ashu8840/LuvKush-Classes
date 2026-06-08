const express = require("express");
const {
  getStudentAnalytics,
  getBatchComparison,
  getAiInsights,
  getHeatmap,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/student", authorize("student"), getStudentAnalytics);
router.get("/student/:studentId", authorize("admin", "teacher"), getStudentAnalytics);
router.get("/heatmap", authorize("student"), getHeatmap);
router.get("/heatmap/:studentId", authorize("admin", "teacher"), getHeatmap);
router.get("/insights", authorize("student"), getAiInsights);
router.get("/insights/:studentId", authorize("admin", "teacher"), getAiInsights);
router.get("/batch/:batchId/comparison", authorize("admin", "teacher"), getBatchComparison);

module.exports = router;