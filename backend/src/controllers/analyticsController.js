const axios = require("axios");
const StudentProfile = require("../models/StudentProfile");
const PracticeSession = require("../models/PracticeSession");
const ShorthandAttempt = require("../models/ShorthandAttempt");
const ExamAttempt = require("../models/ExamAttempt");
const Attendance = require("../models/Attendance");

const getDateRange = (days = 30) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

const buildHeatmap = (sessions) => {
  const heatmap = {};
  sessions.forEach((s) => {
    const key = new Date(s.practicedAt).toISOString().split("T")[0];
    heatmap[key] = (heatmap[key] || 0) + 1;
  });
  return heatmap;
};

const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.user.role === "student" ? req.user._id : req.params.studentId;
    const days = parseInt(req.query.days) || 30;
    const { start } = getDateRange(days);

    const [profile, sessions, shorthandAttempts, examAttempts] = await Promise.all([
      StudentProfile.findOne({ user: studentId }).populate("batch course", "name"),
      PracticeSession.find({ student: studentId, practicedAt: { $gte: start } }).sort({ practicedAt: 1 }),
      ShorthandAttempt.find({ student: studentId, createdAt: { $gte: start } }).sort({ createdAt: 1 }),
      ExamAttempt.find({ student: studentId, status: "evaluated", createdAt: { $gte: start } })
        .populate("exam", "title type")
        .sort({ createdAt: -1 }),
    ]);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const wpmTrend = sessions.map((s) => ({
      date: s.practicedAt,
      wpm: s.wpm,
      accuracy: s.accuracy,
      type: s.type,
    }));

    const accuracyTrend = shorthandAttempts.map((a) => ({
      date: a.createdAt,
      accuracy: a.accuracy,
      wpm: a.wpm,
    }));

    const xpTrend = [];
    let cumulativeXp = 0;
    sessions.forEach((s) => {
      cumulativeXp += s.xpEarned;
      xpTrend.push({ date: s.practicedAt, xp: cumulativeXp });
    });

    res.json({
      success: true,
      data: {
        profile: {
          name: profile.user,
          level: profile.level,
          xp: profile.xp,
          streak: profile.streak,
          batch: profile.batch,
          course: profile.course,
        },
        graphs: {
          wpmTrend,
          accuracyTrend,
          xpTrend,
          heatmap: buildHeatmap(sessions),
        },
        examAttempts: examAttempts.map((a) => ({
          exam: a.exam,
          score: a.score,
          wpm: a.wpm,
          accuracy: a.accuracy,
          submittedAt: a.submittedAt,
        })),
        summary: {
          totalSessions: sessions.length,
          avgWpm: sessions.length
            ? Math.round(sessions.reduce((s, x) => s + x.wpm, 0) / sessions.length)
            : 0,
          avgAccuracy: sessions.length
            ? Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / sessions.length)
            : 0,
          totalXpEarned: sessions.reduce((s, x) => s + x.xpEarned, 0),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBatchComparison = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { start } = getDateRange(30);

    const profiles = await StudentProfile.find({ batch: batchId })
      .populate("user", "name avatar");

    const studentIds = profiles.map((p) => p.user._id);

    const sessionAgg = await PracticeSession.aggregate([
      { $match: { student: { $in: studentIds }, practicedAt: { $gte: start } } },
      {
        $group: {
          _id: "$student",
          avgWpm: { $avg: "$wpm" },
          avgAccuracy: { $avg: "$accuracy" },
          totalXp: { $sum: "$xpEarned" },
          sessions: { $sum: 1 },
        },
      },
    ]);

    const comparison = profiles.map((p) => {
      const stats = sessionAgg.find((s) => s._id.toString() === p.user._id.toString());
      return {
        studentId: p.user._id,
        name: p.user.name,
        avatar: p.user.avatar,
        level: p.level,
        xp: p.xp,
        streak: p.streak,
        attendancePercent: p.attendancePercent,
        avgWpm: Math.round(stats?.avgWpm || 0),
        avgAccuracy: Math.round(stats?.avgAccuracy || 0),
        periodXp: stats?.totalXp || 0,
        sessions: stats?.sessions || 0,
      };
    });

    comparison.sort((a, b) => b.periodXp - a.periodXp);

    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAiInsights = async (req, res) => {
  try {
    const studentId = req.user.role === "student" ? req.user._id : req.params.studentId;
    const { start } = getDateRange(14);

    const [profile, sessions, attempts] = await Promise.all([
      StudentProfile.findOne({ user: studentId }).populate("user", "name"),
      PracticeSession.find({ student: studentId, practicedAt: { $gte: start } }),
      ShorthandAttempt.find({ student: studentId, createdAt: { $gte: start } }).limit(10),
    ]);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const avgWpm = sessions.length
      ? Math.round(sessions.reduce((s, x) => s + x.wpm, 0) / sessions.length)
      : 0;
    const avgAccuracy = sessions.length
      ? Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / sessions.length)
      : 0;

    const context = `Student: ${profile.user?.name || "Student"}, Level ${profile.level}, XP ${profile.xp}, Streak ${profile.streak} days. Last 14 days: ${sessions.length} sessions, avg WPM ${avgWpm}, avg accuracy ${avgAccuracy}%. Recent shorthand attempts: ${attempts.length}.`;

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        success: true,
        data: {
          insights:
            "Keep practicing daily to maintain your streak. Focus on accuracy before increasing speed. Review shorthand mistakes from recent attempts.",
          context,
        },
      });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an analytics coach for a shorthand/typing institute. Provide personalized study insights in 4-6 bullet points.",
          },
          { role: "user", content: `Analyze this student data and give actionable insights:\n${context}` },
        ],
        max_tokens: 512,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const insights = response.data.choices[0]?.message?.content || "Continue regular practice.";

    res.json({ success: true, data: { insights, context } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message,
    });
  }
};

const getHeatmap = async (req, res) => {
  try {
    const studentId = req.user.role === "student" ? req.user._id : req.params.studentId;
    const days = parseInt(req.query.days) || 90;
    const { start } = getDateRange(days);

    const [sessions, attendance] = await Promise.all([
      PracticeSession.find({ student: studentId, practicedAt: { $gte: start } }),
      Attendance.find({ student: studentId, date: { $gte: start } }),
    ]);

    res.json({
      success: true,
      data: {
        practice: buildHeatmap(sessions),
        attendance: attendance.reduce((acc, a) => {
          const key = new Date(a.date).toISOString().split("T")[0];
          acc[key] = a.status;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentAnalytics,
  getBatchComparison,
  getAiInsights,
  getHeatmap,
};