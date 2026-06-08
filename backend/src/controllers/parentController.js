const ParentLink = require("../models/ParentLink");
const StudentProfile = require("../models/StudentProfile");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const ExamAttempt = require("../models/ExamAttempt");
const Certificate = require("../models/Certificate");
const User = require("../models/User");

const verifyParentAccess = async (parentId, studentId) => {
  const link = await ParentLink.findOne({ parent: parentId, student: studentId });
  return !!link;
};

const getLinkedChildren = async (req, res) => {
  try {
    const links = await ParentLink.find({ parent: req.user._id })
      .populate("student", "name email phone avatar");

    const children = await Promise.all(
      links.map(async (link) => {
        const profile = await StudentProfile.findOne({ user: link.student._id })
          .populate("course batch teacher", "name");
        return {
          student: link.student,
          relationship: link.relationship,
          profile,
        };
      })
    );

    res.json({ success: true, data: children });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChildDashboard = async (req, res) => {
  try {
    const { studentId } = req.params;

    const hasAccess = await verifyParentAccess(req.user._id, studentId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Not linked to this student" });
    }

    const [student, profile, attendance, fees, examAttempts, certificates] = await Promise.all([
      User.findById(studentId).select("name email phone avatar"),
      StudentProfile.findOne({ user: studentId })
        .populate("course batch teacher", "name category level timing"),
      Attendance.find({ student: studentId }).sort({ date: -1 }).limit(60),
      Fee.find({ student: studentId }).sort({ dueDate: -1 }),
      ExamAttempt.find({ student: studentId, status: "evaluated" })
        .populate("exam", "title type totalMarks")
        .sort({ submittedAt: -1 })
        .limit(10),
      Certificate.find({ student: studentId })
        .populate("course", "name")
        .sort({ issuedAt: -1 }),
    ]);

    const presentDays = attendance.filter((a) =>
      ["present", "late"].includes(a.status)
    ).length;

    res.json({
      success: true,
      data: {
        student,
        profile,
        attendance: {
          records: attendance,
          percent: profile?.attendancePercent || 0,
          presentDays,
        },
        fees,
        examResults: examAttempts.map((a) => ({
          exam: a.exam,
          score: a.score,
          wpm: a.wpm,
          accuracy: a.accuracy,
          submittedAt: a.submittedAt,
        })),
        certificates,
        gamification: {
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          streak: profile?.streak || 0,
          badges: profile?.badges || [],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChildAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const hasAccess = await verifyParentAccess(req.user._id, studentId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Not linked to this student" });
    }

    const attendance = await Attendance.find({ student: studentId })
      .populate("batch", "name")
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 90);

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChildFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const hasAccess = await verifyParentAccess(req.user._id, studentId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Not linked to this student" });
    }

    const fees = await Fee.find({ student: studentId }).sort({ dueDate: -1 });
    const profile = await StudentProfile.findOne({ user: studentId }).select(
      "feesStatus totalFees paidFees"
    );

    res.json({
      success: true,
      data: { fees, summary: profile },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChildScores = async (req, res) => {
  try {
    const { studentId } = req.params;
    const hasAccess = await verifyParentAccess(req.user._id, studentId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Not linked to this student" });
    }

    const attempts = await ExamAttempt.find({ student: studentId, status: "evaluated" })
      .populate("exam", "title type totalMarks scheduledAt")
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChildCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const hasAccess = await verifyParentAccess(req.user._id, studentId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Not linked to this student" });
    }

    const certificates = await Certificate.find({ student: studentId })
      .populate("course", "name category")
      .sort({ issuedAt: -1 });

    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLinkedChildren,
  getChildDashboard,
  getChildAttendance,
  getChildFees,
  getChildScores,
  getChildCertificates,
};