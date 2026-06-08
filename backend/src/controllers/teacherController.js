const Batch = require("../models/Batch");
const StudentProfile = require("../models/StudentProfile");
const Attendance = require("../models/Attendance");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const ShorthandAttempt = require("../models/ShorthandAttempt");
const PracticeSession = require("../models/PracticeSession");
const TeacherProfile = require("../models/TeacherProfile");

const getDashboard = async (req, res) => {
  try {
    const profile = await TeacherProfile.findOne({ user: req.user._id })
      .populate("batches", "name timing type students");

    const batchIds = profile?.batches?.map((b) => b._id) || [];

    const [batches, students, upcomingExams, todayAttendance] = await Promise.all([
      Batch.find({ teacher: req.user._id }).populate("course", "name"),
      StudentProfile.find({ teacher: req.user._id })
        .populate("user", "name email avatar")
        .populate("batch course", "name"),
      Exam.find({
        batch: { $in: batchIds },
        scheduledAt: { $gte: new Date() },
      }).limit(5),
      Attendance.countDocuments({
        batch: { $in: batchIds },
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "present",
      }),
    ]);

    const weakStudents = students.filter((s) => s.performanceScore < 50);
    const strongStudents = students.filter((s) => s.performanceScore >= 80);

    res.json({
      success: true,
      data: {
        profile,
        batches,
        students,
        upcomingExams,
        todayAttendance,
        weakStudents,
        strongStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentReport = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.params.studentId, teacher: req.user._id })
      .populate("user", "name email avatar phone createdAt")
      .populate("batch course", "name title timing");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Student not found or not assigned to you" });
    }

    const studentId = profile.user._id;

    const [examAttempts, shorthandAttempts, attendanceRecords, typingSessions] = await Promise.all([
      ExamAttempt.find({ student: studentId, status: "evaluated" })
        .populate({
          path: "exam",
          select: "title type questionType totalMarks scheduledAt duration batch course",
          populate: [{ path: "batch", select: "name" }, { path: "course", select: "name" }],
        })
        .sort({ submittedAt: -1 })
        .limit(50),
      ShorthandAttempt.find({ student: studentId })
        .populate("dictation", "title targetWpm durationSeconds")
        .sort({ createdAt: -1 })
        .limit(30),
      Attendance.find({ student: studentId })
        .populate("batch", "name")
        .populate("markedBy", "name role")
        .sort({ date: -1 })
        .limit(30),
      PracticeSession.find({ student: studentId, type: "typing" })
        .populate("passage", "title language difficulty")
        .sort({ practicedAt: -1 })
        .limit(20),
    ]);

    const shorthandAvg =
      shorthandAttempts.length > 0
        ? {
            wpm: Math.round(shorthandAttempts.reduce((s, a) => s + a.wpm, 0) / shorthandAttempts.length),
            accuracy: Math.round(shorthandAttempts.reduce((s, a) => s + a.accuracy, 0) / shorthandAttempts.length),
          }
        : { wpm: 0, accuracy: 0 };

    const typingAvg =
      typingSessions.length > 0
        ? {
            wpm: Math.round(typingSessions.reduce((s, t) => s + t.wpm, 0) / typingSessions.length),
            accuracy: Math.round(typingSessions.reduce((s, t) => s + t.accuracy, 0) / typingSessions.length),
          }
        : { wpm: 0, accuracy: 0 };

    const presentCount = attendanceRecords.filter((a) => ["present", "late"].includes(a.status)).length;
    const attendanceSummary = {
      percent: profile.attendancePercent || 0,
      totalMarked: attendanceRecords.length,
      present: presentCount,
      absent: attendanceRecords.filter((a) => a.status === "absent").length,
      late: attendanceRecords.filter((a) => a.status === "late").length,
      leave: attendanceRecords.filter((a) => a.status === "leave").length,
    };

    res.json({
      success: true,
      data: {
        profile,
        exams: examAttempts.map((a) => ({
          attemptId: a._id,
          exam: a.exam,
          score: a.score,
          wpm: a.wpm,
          accuracy: a.accuracy,
          status: a.status,
          submittedAt: a.submittedAt,
          timeTakenSeconds: a.timeTakenSeconds,
          analysis: a.analysis,
          totalMarks: a.exam?.totalMarks,
          percentage: a.exam?.totalMarks ? Math.round((a.score / a.exam.totalMarks) * 100) : null,
        })),
        shorthand: {
          totalAttempts: shorthandAttempts.length,
          avgWpm: shorthandAvg.wpm,
          avgAccuracy: shorthandAvg.accuracy,
          recent: shorthandAttempts.slice(0, 10),
        },
        typing: {
          totalSessions: typingSessions.length,
          avgWpm: typingAvg.wpm,
          avgAccuracy: typingAvg.accuracy,
          recent: typingSessions.slice(0, 10),
        },
        attendance: {
          summary: attendanceSummary,
          recent: attendanceRecords,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getStudentReport };