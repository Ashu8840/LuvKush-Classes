const TypingPassage = require("../models/TypingPassage");
const PracticeSession = require("../models/PracticeSession");
const StudentProfile = require("../models/StudentProfile");
const { generatePassageWithGroq, getTypingInsights, countWords } = require("../services/typingAnalyzer");

const createPassage = async (req, res) => {
  try {
    const { title, content, language, difficulty, category, batch, course } = req.body;

    if (!title || !content || !language) {
      return res.status(400).json({ success: false, message: "title, content, and language are required" });
    }

    const wordCount = countWords(content);
    if (wordCount < 100) {
      return res.status(400).json({ success: false, message: "Content must have at least 100 words" });
    }

    const passage = await TypingPassage.create({
      title,
      content: content.trim(),
      language,
      difficulty: difficulty || "intermediate",
      category: category || "general",
      batch: batch || undefined,
      course: course || undefined,
      uploadedBy: req.user._id,
      isAiGenerated: req.body.isAiGenerated || false,
    });

    res.status(201).json({ success: true, data: passage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPassages = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.user.role === "student") {
      if (req.query.language) filter.language = req.query.language;
      if (req.query.difficulty) filter.difficulty = req.query.difficulty;
      if (req.query.category) filter.category = req.query.category;

      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile?.batch) {
        filter.$or = [{ batch: profile.batch }, { batch: null }, { batch: { $exists: false } }];
      }
    } else {
      if (req.query.language) filter.language = req.query.language;
      if (req.query.difficulty) filter.difficulty = req.query.difficulty;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.includeInactive === "true") delete filter.isActive;
    }

    const passages = await TypingPassage.find(filter)
      .populate("batch course uploadedBy", "name title")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: passages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPassageById = async (req, res) => {
  try {
    const passage = await TypingPassage.findById(req.params.id)
      .populate("batch course uploadedBy", "name title");

    if (!passage || (!passage.isActive && req.user.role === "student")) {
      return res.status(404).json({ success: false, message: "Passage not found" });
    }

    res.json({ success: true, data: passage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassage = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.uploadedBy;

    if (updates.content) {
      updates.content = updates.content.trim();
    }

    const passage = await TypingPassage.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!passage) {
      return res.status(404).json({ success: false, message: "Passage not found" });
    }

    res.json({ success: true, data: passage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePassage = async (req, res) => {
  try {
    const passage = await TypingPassage.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!passage) {
      return res.status(404).json({ success: false, message: "Passage not found" });
    }

    res.json({ success: true, message: "Passage removed", data: passage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePassage = async (req, res) => {
  try {
    const { language = "english", topic = "", difficulty = "intermediate", targetWords = 1200 } = req.body;

    const generated = await generatePassageWithGroq({ language, topic, difficulty, targetWords });

    res.json({
      success: true,
      data: {
        ...generated,
        language,
        difficulty,
        category: topic || "general",
        isAiGenerated: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMySessions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const sessions = await PracticeSession.find({
      student: req.user._id,
      type: "typing",
    })
      .populate("passage", "title language difficulty category wordCount")
      .sort({ practicedAt: -1 })
      .limit(limit);

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const analyzeTyping = async (req, res) => {
  try {
    const [sessions, profile] = await Promise.all([
      PracticeSession.find({ student: req.user._id, type: "typing" })
        .populate("passage", "title language")
        .sort({ practicedAt: -1 })
        .limit(5),
      StudentProfile.findOne({ user: req.user._id }),
    ]);

    if (sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No saved typing sessions yet. Complete and save at least one practice session.",
      });
    }

    const profileStats = {
      level: profile?.level || 1,
      xp: profile?.xp || 0,
      streak: profile?.streak || 0,
      performanceScore: profile?.performanceScore || 0,
      totalTypingSessions: await PracticeSession.countDocuments({
        student: req.user._id,
        type: "typing",
      }),
    };

    const analysis = await getTypingInsights(sessions, profileStats);

    res.json({
      success: true,
      data: {
        sessions,
        ...analysis,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPassage,
  getPassages,
  getPassageById,
  updatePassage,
  deletePassage,
  generatePassage,
  getMySessions,
  analyzeTyping,
};