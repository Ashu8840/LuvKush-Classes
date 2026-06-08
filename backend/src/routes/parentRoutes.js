const express = require("express");
const {
  getLinkedChildren,
  getChildDashboard,
  getChildAttendance,
  getChildFees,
  getChildScores,
  getChildCertificates,
} = require("../controllers/parentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("parent"));

router.get("/children", getLinkedChildren);
router.get("/children/:studentId/dashboard", getChildDashboard);
router.get("/children/:studentId/attendance", getChildAttendance);
router.get("/children/:studentId/fees", getChildFees);
router.get("/children/:studentId/scores", getChildScores);
router.get("/children/:studentId/certificates", getChildCertificates);

module.exports = router;