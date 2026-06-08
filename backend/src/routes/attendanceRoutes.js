const express = require("express");
const { markAttendance, getAttendance, markBulkAttendance, exportAttendance, getMarkList } = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/export", protect, authorize("admin"), exportAttendance);
router.get("/mark-list", protect, authorize("teacher"), getMarkList);
router.get("/", protect, getAttendance);
router.post("/", protect, authorize("teacher"), markAttendance);
router.post("/bulk", protect, authorize("teacher"), markBulkAttendance);

module.exports = router;