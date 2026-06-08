const ShorthandDictation = require("../models/ShorthandDictation");
const ShorthandAttempt = require("../models/ShorthandAttempt");
const StudentProfile = require("../models/StudentProfile");
const { evaluateWithInsights } = require("../services/shorthandEvaluator");
const { awardXp } = require("../services/gamificationService");
const { notifyAchievement } = require("../services/notificationService");

const createDictation = async (req, res) => {
  try {
    const dictation = await ShorthandDictation.create({
      ...req.body,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: dictation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDictations = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.user.role === "student") {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (!profile?.teacher) {
        return res.json({ success: true, data: [] });
      }
      filter.uploadedBy = profile.teacher;
      const scope = [];
      if (profile.batch) {
        scope.push({ $or: [{ batch: profile.batch }, { batch: null }] });
      }
      if (profile.course) {
        scope.push({ $or: [{ course: profile.course }, { course: null }] });
      }
      if (scope.length) filter.$and = scope;
    } else {
      if (req.query.batchId) filter.batch = req.query.batchId;
      if (req.query.courseId) filter.course = req.query.courseId;
      if (req.query.includeInactive === "true") delete filter.isActive;
    }

    const dictations = await ShorthandDictation.find(filter)
      .populate("batch course uploadedBy", "name title")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: dictations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDictationById = async (req, res) => {
  try {
    const dictation = await ShorthandDictation.findById(req.params.id)
      .populate("batch course uploadedBy", "name title");

    if (!dictation) {
      return res.status(404).json({ success: false, message: "Dictation not found" });
    }

    const data = dictation.toObject();
    if (req.user.role === "student") {
      delete data.transcript;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDictation = async (req, res) => {
  try {
    const dictation = await ShorthandDictation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!dictation) {
      return res.status(404).json({ success: false, message: "Dictation not found" });
    }

    res.json({ success: true, data: dictation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDictation = async (req, res) => {
  try {
    const dictation = await ShorthandDictation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!dictation) {
      return res.status(404).json({ success: false, message: "Dictation not found" });
    }

    res.json({ success: true, message: "Dictation deactivated", data: dictation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const { typedText, durationSeconds } = req.body;
    const dictation = await ShorthandDictation.findById(req.params.id);

    if (!dictation || !dictation.isActive) {
      return res.status(404).json({ success: false, message: "Dictation not found" });
    }

    if (!typedText || !durationSeconds) {
      return res.status(400).json({ success: false, message: "typedText and durationSeconds are required" });
    }

    const evaluation = await evaluateWithInsights(
      dictation.transcript,
      typedText,
      durationSeconds
    );

    const previousAttempt = await ShorthandAttempt.findOne({
      student: req.user._id,
      dictation: dictation._id,
    }).sort({ createdAt: -1 });

    const improvementFromPrevious = previousAttempt
      ? evaluation.accuracy - previousAttempt.accuracy
      : 0;

    const gamification = await awardXp(req.user._id, {
      wpm: evaluation.wpm,
      accuracy: evaluation.accuracy,
      type: "shorthand",
      durationSeconds,
    });

    const attempt = await ShorthandAttempt.create({
      dictation: dictation._id,
      student: req.user._id,
      typedText,
      accuracy: evaluation.accuracy,
      wpm: evaluation.wpm,
      mistakes: evaluation.mistakes,
      improvementFromPrevious,
      xpEarned: gamification?.xpEarned || 0,
      durationSeconds,
      insights: evaluation.insights,
    });

    if (gamification?.newBadges?.length) {
      for (const badge of gamification.newBadges) {
        await notifyAchievement(req.user._id, badge);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        attempt,
        evaluation: {
          accuracy: evaluation.accuracy,
          wpm: evaluation.wpm,
          mistakes: evaluation.mistakes,
          insights: evaluation.insights,
          improvementFromPrevious,
        },
        gamification: gamification
          ? {
              xpEarned: gamification.xpEarned,
              level: gamification.profile.level,
              streak: gamification.profile.streak,
              newBadges: gamification.newBadges,
              levelInfo: gamification.levelInfo,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyAttempts = async (req, res) => {
  try {
    const filter = { student: req.user._id };
    if (req.query.dictationId) filter.dictation = req.query.dictationId;

    const attempts = await ShorthandAttempt.find(filter)
      .populate("dictation", "title targetWpm durationSeconds")
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProgress = async (req, res) => {
  try {
    const studentId = req.user.role === "student" ? req.user._id : req.params.studentId;

    const [attempts, profile] = await Promise.all([
      ShorthandAttempt.find({ student: studentId })
        .populate("dictation", "title targetWpm")
        .sort({ createdAt: -1 })
        .limit(30),
      StudentProfile.findOne({ user: studentId }).select("xp level streak practiceHistory badges"),
    ]);

    const avgWpm =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.wpm, 0) / attempts.length)
        : 0;
    const avgAccuracy =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length)
        : 0;

    const byDictation = {};
    attempts.forEach((a) => {
      const id = a.dictation?._id?.toString();
      if (!id) return;
      if (!byDictation[id] || a.accuracy > byDictation[id].bestAccuracy) {
        byDictation[id] = {
          dictation: a.dictation,
          bestAccuracy: a.accuracy,
          bestWpm: a.wpm,
          attempts: (byDictation[id]?.attempts || 0) + 1,
        };
      } else {
        byDictation[id].attempts += 1;
      }
    });

    res.json({
      success: true,
      data: {
        profile,
        summary: { totalAttempts: attempts.length, avgWpm, avgAccuracy },
        recentAttempts: attempts.slice(0, 10),
        byDictation: Object.values(byDictation),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDictation,
  getDictations,
  getDictationById,
  updateDictation,
  deleteDictation,
  submitAttempt,
  getMyAttempts,
  getProgress,
};