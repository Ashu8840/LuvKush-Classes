const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const StudentProfile = require("../models/StudentProfile");

const buildFeeFilter = (query) => {
  const filter = {};
  if (query.studentId) filter.student = query.studentId;
  if (query.status) filter.status = query.status;
  if (query.fromDate || query.toDate) {
    filter.dueDate = {};
    if (query.fromDate) filter.dueDate.$gte = new Date(query.fromDate);
    if (query.toDate) {
      const end = new Date(query.toDate);
      end.setHours(23, 59, 59, 999);
      filter.dueDate.$lte = end;
    }
  }
  return filter;
};

const getFees = async (req, res) => {
  try {
    const filter = buildFeeFilter(req.query);
    if (req.user.role === "student") {
      filter.student = req.user._id;
      const fees = await Fee.find(filter)
        .populate("student", "name email phone")
        .sort({ dueDate: -1 });
      return res.json({ success: true, data: fees });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [fees, total] = await Promise.all([
      Fee.find(filter)
        .populate("student", "name email phone")
        .sort({ dueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Fee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        fees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportFees = async (req, res) => {
  try {
    const filter = buildFeeFilter(req.query);
    const fees = await Fee.find(filter)
      .populate("student", "name email phone")
      .sort({ dueDate: -1 });

    const headers = ["Student", "Email", "Phone", "Amount", "Paid", "Due Date", "Status", "Remarks", "Created At"];
    const rows = fees.map((f) => [
      f.student?.name || "",
      f.student?.email || "",
      f.student?.phone || "",
      f.amount,
      f.paidAmount || 0,
      f.dueDate ? new Date(f.dueDate).toISOString().split("T")[0] : "",
      f.status,
      f.remarks || "",
      f.createdAt ? new Date(f.createdAt).toISOString() : "",
    ]);

    const escape = (val) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const from = req.query.fromDate || "all";
    const to = req.query.toDate || "all";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="fees-${from}-to-${to}.csv"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createFee = async (req, res) => {
  try {
    const fee = await Fee.create({ ...req.body, recordedBy: req.user._id });

    const profile = await StudentProfile.findOne({ user: fee.student });
    if (profile) {
      profile.totalFees = (profile.totalFees || 0) + fee.amount;
      if (profile.feesStatus === "paid" && profile.paidFees < profile.totalFees) {
        profile.feesStatus = "partial";
      } else if (!profile.paidFees) {
        profile.feesStatus = "pending";
      }
      await profile.save();
    }

    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { paidAmount, paymentMethod, receiptNumber } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });

    fee.paidAmount += paidAmount;
    fee.paymentMethod = paymentMethod;
    fee.receiptNumber = receiptNumber;

    if (fee.paidAmount >= fee.amount) fee.status = "paid";
    else if (fee.paidAmount > 0) fee.status = "partial";
    else fee.status = "pending";

    await fee.save();

    const profile = await StudentProfile.findOne({ user: fee.student });
    if (profile) {
      profile.paidFees = (profile.paidFees || 0) + paidAmount;
      profile.feesStatus = fee.status;
      await profile.save();
    }

    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) {
        const end = new Date(req.query.toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const payments = await Payment.find(filter)
      .populate("student", "name email phone")
      .populate("fee", "amount dueDate status")
      .sort({ createdAt: -1 });

    const headers = ["Student", "Email", "Amount", "UTR", "Status", "Submitted At", "Reviewed At", "Rejection Reason"];
    const rows = payments.map((p) => [
      p.student?.name || "",
      p.student?.email || "",
      p.amount,
      p.utr,
      p.status,
      p.createdAt ? new Date(p.createdAt).toISOString() : "",
      p.reviewedAt ? new Date(p.reviewedAt).toISOString() : "",
      p.rejectionReason || "",
    ]);

    const escape = (val) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const from = req.query.fromDate || "all";
    const to = req.query.toDate || "all";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="payment-approvals-${from}-to-${to}.csv"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getFees, createFee, recordPayment, exportFees, exportPayments };