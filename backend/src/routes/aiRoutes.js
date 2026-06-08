const express = require("express");
const { askCoach, generateQuestions } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/coach", protect, askCoach);
router.post("/generate-questions", protect, authorize("admin", "teacher"), generateQuestions);

module.exports = router;