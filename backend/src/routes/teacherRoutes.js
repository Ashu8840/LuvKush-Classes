const express = require("express");
const { getDashboard, getStudentReport } = require("../controllers/teacherController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("teacher", "admin"));

router.get("/dashboard", getDashboard);
router.get("/students/:studentId/report", getStudentReport);

module.exports = router;