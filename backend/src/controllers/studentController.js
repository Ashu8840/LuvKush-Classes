const StudentProfile = require("../models/StudentProfile");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
const PracticeSession = require("../models/PracticeSession");
const ShorthandAttempt = require("../models/ShorthandAttempt");
const { awardXp, getMyStats, xpForNextLevel } = require("../services/gamificationService");
const { notifyAchievement } = require("../services/notificationService");

const getDashboard = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
      .populate("course batch teacher", "name category level timing");

    const [attendance, fees, exams, notifications, courses, recentSessions, recentShorthand, gamificationStats] =
      await Promise.all([
        Attendance.find({ student: req.user._id }).sort({ date: -1 }).limit(30),
        Fee.find({ student: req.user._id }).sort({ dueDate: -1 }),
        Exam.find({
          isPublished: true,
          scheduledAt: { $gte: new Date() },
        }).limit(5).populate("course", "name"),
        Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(10),
        Course.find({ isActive: true }),
        PracticeSession.find({ student: req.user._id }).sort({ practicedAt: -1 }).limit(5),
        ShorthandAttempt.find({ student: req.user._id })
          .populate("dictation", "title targetWpm")
          .sort({ createdAt: -1 })
          .limit(3),
        getMyStats(req.user._id),
      ]);

    const presentDays = attendance.filter((a) =>
      ["present", "late"].includes(a.status)
    ).length;

    res.json({
      success: true,
      data: {
        profile,
        attendance: {
          records: attendance,
          percent: profile?.attendancePercent || 0,
          presentDays,
        },
        fees,
        upcomingExams: exams,
        notifications,
        courses,
        gamification: {
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          streak: profile?.streak || 0,
          badges: profile?.badges || [],
          levelInfo: xpForNextLevel(profile?.xp || 0),
          recentSessions,
          recentShorthand,
          stats: gamificationStats,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveTypingPractice = async (req, res) => {
  try {
    const {
      wpm,
      accuracy,
      language,
      durationSeconds = 60,
      passageId,
      errorKeys = [],
    } = req.body;
    const profile = await StudentProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const gamification = await awardXp(req.user._id, {
      wpm,
      accuracy,
      type: "typing",
      durationSeconds,
      language,
      passageId,
      errorKeys,
    });

    if (gamification?.newBadges?.length) {
      for (const badge of gamification.newBadges) {
        await notifyAchievement(req.user._id, badge);
      }
    }

    res.json({
      success: true,
      data: {
        wpm,
        accuracy,
        language,
        performanceScore: gamification?.profile?.performanceScore || profile.performanceScore,
        streak: gamification?.profile?.streak || profile.streak,
        badges: gamification?.profile?.badges || profile.badges,
        xpEarned: gamification?.xpEarned || 0,
        level: gamification?.profile?.level || profile.level,
        levelInfo: gamification?.levelInfo,
        newBadges: gamification?.newBadges || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, saveTypingPractice };