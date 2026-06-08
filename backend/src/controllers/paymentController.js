const Payment = require("../models/Payment");
const Fee = require("../models/Fee");
const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const { buildUpiPaymentUrl, getUpiConfig } = require("../utils/upi");
const { notifyPaymentSuccess, notifyAdminsPaymentPending } = require("../services/notificationService");
const { deleteCloudinaryAsset } = require("../utils/cloudinaryHelper");

const validateUtr = (utr) => typeof utr === "string" && /^\d{12}$/.test(utr);

const getUpiDetails = async (req, res) => {
  try {
    const { feeId } = req.query;

    if (!feeId) {
      return res.status(400).json({ success: false, message: "feeId is required" });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee record not found" });
    }

    if (req.user.role === "student" && fee.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized for this fee" });
    }

    const pendingAmount = fee.amount - (fee.paidAmount || 0);
    if (pendingAmount <= 0) {
      return res.status(400).json({ success: false, message: "Fee already paid" });
    }

    const { upiId, merchantName } = getUpiConfig();
    const studentId = fee.student.toString();
    const note = `FEE_${studentId}_${fee._id}`;

    const upiUrl = buildUpiPaymentUrl({
      upiId,
      merchantName,
      amount: pendingAmount,
      note,
    });

    res.json({
      success: true,
      data: {
        upiId,
        merchantName,
        amount: pendingAmount,
        currency: "INR",
        note,
        upiUrl,
        feeId: fee._id,
        studentId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitPaymentProof = async (req, res) => {
  try {
    const { feeId, amount, utr, screenshotUrl, screenshotPublicId } = req.body;

    if (!feeId || !amount || !utr) {
      return res.status(400).json({
        success: false,
        message: "feeId, amount, and utr are required",
      });
    }

    if (!screenshotUrl) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }

    if (!validateUtr(utr)) {
      return res.status(400).json({
        success: false,
        message: "UTR must be exactly 12 numeric digits",
      });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee record not found" });
    }

    if (fee.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized for this fee" });
    }

    const pendingAmount = fee.amount - (fee.paidAmount || 0);
    if (pendingAmount <= 0) {
      return res.status(400).json({ success: false, message: "Fee already paid" });
    }

    if (Number(amount) !== pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount must match pending fee of ₹${pendingAmount}`,
      });
    }

    const existingUtr = await Payment.findOne({ utr });
    if (existingUtr) {
      return res.status(400).json({
        success: false,
        message: "This UTR has already been submitted. Contact admin if this is an error.",
      });
    }

    const existingPending = await Payment.findOne({
      fee: feeId,
      student: req.user._id,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "A payment proof is already pending verification for this fee",
      });
    }

    const payment = await Payment.create({
      fee: feeId,
      student: req.user._id,
      amount: pendingAmount,
      utr,
      screenshotUrl,
      screenshotPublicId: screenshotPublicId || undefined,
      status: "pending",
      receiptNumber: `UPI-${Date.now()}`,
    });

    const student = await User.findById(req.user._id).select("name");
    notifyAdminsPaymentPending(student?.name || "Student", pendingAmount, utr).catch(() => {});

    res.status(201).json({
      success: true,
      data: payment,
      message:
        "Payment proof submitted. Access will update once admin verifies your UTR against bank records.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This UTR has already been used",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate("student", "name email");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ success: false, message: `Payment is already ${payment.status}` });
    }

    payment.status = "approved";
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();

    const screenshotRef = payment.screenshotPublicId || payment.screenshotUrl;
    payment.screenshotUrl = undefined;
    payment.screenshotPublicId = undefined;
    await payment.save();

    await deleteCloudinaryAsset(screenshotRef);

    const fee = await Fee.findById(payment.fee);
    if (fee) {
      fee.paidAmount = (fee.paidAmount || 0) + payment.amount;
      fee.status = fee.paidAmount >= fee.amount ? "paid" : "partial";
      fee.paymentMethod = "upi";
      fee.receiptNumber = payment.receiptNumber;
      await fee.save();

      const profile = await StudentProfile.findOne({ user: payment.student });
      if (profile) {
        profile.paidFees = (profile.paidFees || 0) + payment.amount;
        profile.feesStatus = fee.status;
        await profile.save();
      }
    }

    await notifyPaymentSuccess(payment.student._id || payment.student, payment.amount, payment.utr);

    res.json({
      success: true,
      data: payment,
      message: "Payment approved and fee status updated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.paymentId).populate("fee");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ success: false, message: `Payment is already ${payment.status}` });
    }

    payment.status = "rejected";
    payment.rejectionReason = reason || "UTR could not be verified";
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();
    await payment.save();

    if (payment.fee) {
      const fee = await Fee.findById(payment.fee._id || payment.fee);
      if (fee && fee.status !== "paid") {
        fee.status = fee.paidAmount > 0 ? "partial" : "pending";
        await fee.save();
        const profile = await StudentProfile.findOne({ user: payment.student });
        if (profile) {
          profile.feesStatus = fee.status;
          await profile.save();
        }
      }
    }

    res.json({
      success: true,
      data: payment,
      message: "Payment rejected",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPendingPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filter = { status: "pending" };

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("student", "name email phone")
        .populate("fee", "amount paidAmount dueDate status")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "student") {
      filter.student = req.user._id;
      const payments = await Payment.find(filter)
        .populate("fee", "amount dueDate status")
        .populate("student", "name email phone")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 });
      return res.json({ success: true, data: payments });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    if (req.query.studentId) {
      filter.student = req.query.studentId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) {
        const end = new Date(req.query.toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("fee", "amount dueDate status")
        .populate("student", "name email phone")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUpiDetails,
  submitPaymentProof,
  approvePayment,
  rejectPayment,
  getPendingPayments,
  getPaymentHistory,
};