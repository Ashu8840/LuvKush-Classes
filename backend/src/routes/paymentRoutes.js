const express = require("express");
const {
  getUpiDetails,
  submitPaymentProof,
  approvePayment,
  rejectPayment,
  getPendingPayments,
  getPaymentHistory,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/upi-details", protect, getUpiDetails);
router.post("/verify", protect, authorize("student"), submitPaymentProof);
router.get("/history", protect, getPaymentHistory);
router.get("/pending", protect, authorize("admin"), getPendingPayments);
router.post("/:paymentId/approve", protect, authorize("admin"), approvePayment);
router.post("/:paymentId/reject", protect, authorize("admin"), rejectPayment);

module.exports = router;