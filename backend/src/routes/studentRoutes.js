const express = require("express");
const { getDashboard, saveTypingPractice } = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/dashboard", getDashboard);
router.post("/typing-practice", saveTypingPractice);

module.exports = router;