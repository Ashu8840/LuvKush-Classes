const express = require("express");
const { getFees, createFee, recordPayment, exportFees, exportPayments } = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/export", protect, authorize("admin"), exportFees);
router.get("/payments-export", protect, authorize("admin"), exportPayments);
router.get("/", protect, getFees);
router.post("/", protect, authorize("admin"), createFee);
router.post("/:feeId/pay", protect, authorize("admin"), recordPayment);

module.exports = router;