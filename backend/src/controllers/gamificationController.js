const StudentProfile = require("../models/StudentProfile");
const { getLeaderboard, getMyStats, BADGE_DEFINITIONS } = require("../services/gamificationService");

const getLeaderboardHandler = async (req, res) => {
  try {
    let scopeId = req.query.scopeId;

    if (req.user.role === "student" && !scopeId) {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      scopeId = profile?.batch?.toString();
    }

    const leaderboard = await getLeaderboard({
      period: req.query.period || "week",
      scope: req.query.scope || "batch",
      scopeId,
    });

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAchievements = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const allBadges = Object.keys(BADGE_DEFINITIONS).map((id) => ({
      id,
      earned: profile.badges.includes(id),
      earnedAt: profile.badges.includes(id) ? profile.updatedAt : null,
    }));

    res.json({
      success: true,
      data: {
        badges: profile.badges,
        allBadges,
        streak: profile.streak,
        level: profile.level,
        xp: profile.xp,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyStatsHandler = async (req, res) => {
  try {
    const stats = await getMyStats(req.user._id);

    if (!stats) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeaderboardHandler,
  getAchievements,
  getMyStatsHandler,
};