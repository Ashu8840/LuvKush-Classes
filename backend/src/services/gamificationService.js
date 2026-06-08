const StudentProfile = require("../models/StudentProfile");
const PracticeSession = require("../models/PracticeSession");

const XP_PER_LEVEL = 500;
const LEVEL_MULTIPLIER = 1.2;

const BADGE_DEFINITIONS = {
  "speed-master-100": { check: (profile, session) => session?.wpm >= 100 },
  "speed-demon": { check: (profile, session) => session?.wpm >= 40 },
  "7-day-streak": { check: (profile) => profile.streak >= 7 },
  "top-performer": { check: (profile) => profile.performanceScore >= 90 },
  "accuracy-ace": { check: (profile, session) => session?.accuracy >= 98 },
  "practice-champion": { check: (profile) => profile.practiceHistory?.length >= 50 },
};

const calculateLevel = (xp) => {
  let level = 1;
  let xpNeeded = XP_PER_LEVEL;
  let remaining = xp;

  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level += 1;
    xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  }

  return level;
};

const xpForNextLevel = (xp) => {
  const level = calculateLevel(xp);
  const xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  const xpInCurrentLevel = xp - getXpForLevel(level);
  return { level, current: xpInCurrentLevel, needed: xpNeeded, total: xp };
};

const getXpForLevel = (level) => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, i - 1));
  }
  return total;
};

const calculateXpEarned = ({ wpm = 0, accuracy = 0, type = "typing", durationSeconds = 60 }) => {
  const baseXp = type === "shorthand" ? 25 : type === "exam" ? 40 : 15;
  const wpmBonus = Math.min(Math.floor(wpm / 10) * 2, 30);
  const accuracyBonus = Math.floor(accuracy / 10) * 2;
  const durationBonus = durationSeconds >= 300 ? 10 : durationSeconds >= 120 ? 5 : 0;
  return baseXp + wpmBonus + accuracyBonus + durationBonus;
};

const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const isConsecutiveDay = (lastDate, today) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(lastDate, yesterday);
};

const updateStreak = (profile) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!profile.lastPracticeDate) {
    profile.streak = 1;
    profile.lastPracticeDate = today;
    return profile.streak;
  }

  const last = new Date(profile.lastPracticeDate);
  last.setHours(0, 0, 0, 0);

  if (isSameDay(last, today)) {
    return profile.streak;
  }

  if (isConsecutiveDay(last, today)) {
    profile.streak += 1;
  } else {
    profile.streak = 1;
  }

  profile.lastPracticeDate = today;
  return profile.streak;
};

const checkBadges = (profile, session = null) => {
  const newBadges = [];
  for (const [badgeId, def] of Object.entries(BADGE_DEFINITIONS)) {
    if (!profile.badges.includes(badgeId) && def.check(profile, session)) {
      profile.badges.push(badgeId);
      newBadges.push(badgeId);
    }
  }
  return newBadges;
};

const awardXp = async (
  studentId,
  { wpm, accuracy, type, durationSeconds, language, passageId, errorKeys }
) => {
  const profile = await StudentProfile.findOne({ user: studentId });
  if (!profile) return null;

  const xpEarned = calculateXpEarned({ wpm, accuracy, type, durationSeconds });
  profile.xp += xpEarned;
  profile.level = calculateLevel(profile.xp);

  const performanceScore = Math.round(wpm * (accuracy / 100));
  if (performanceScore > profile.performanceScore) {
    profile.performanceScore = performanceScore;
  }

  updateStreak(profile);

  profile.practiceHistory.push({
    date: new Date(),
    wpm,
    accuracy,
    type,
  });

  if (profile.practiceHistory.length > 100) {
    profile.practiceHistory = profile.practiceHistory.slice(-100);
  }

  const session = { wpm, accuracy, type };
  const newBadges = checkBadges(profile, session);

  await profile.save();

  await PracticeSession.create({
    student: studentId,
    type,
    wpm,
    accuracy,
    language: language || "",
    passage: passageId || undefined,
    durationSeconds: durationSeconds || 0,
    errorKeys: errorKeys || [],
    xpEarned,
    practicedAt: new Date(),
  });

  return { profile, xpEarned, newBadges, levelInfo: xpForNextLevel(profile.xp) };
};

const getLeaderboard = async ({ period = "week", scope = "batch", scopeId } = {}) => {
  const now = new Date();
  const startDate = new Date();

  if (period === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate.setDate(startDate.getDate() - 7);
  }

  const profileFilter = {};
  if (scope === "batch" && scopeId) {
    profileFilter.batch = scopeId;
  }

  const profiles = await StudentProfile.find(profileFilter)
    .populate("user", "name avatar")
    .sort({ xp: -1 })
    .limit(50);

  const studentIds = profiles.map((p) => p.user._id);

  const sessionAgg = await PracticeSession.aggregate([
    {
      $match: {
        student: { $in: studentIds },
        practicedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$student",
        totalXp: { $sum: "$xpEarned" },
        avgWpm: { $avg: "$wpm" },
        avgAccuracy: { $avg: "$accuracy" },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { totalXp: -1 } },
    { $limit: 20 },
  ]);

  const userMap = {};
  profiles.forEach((p) => {
    userMap[p.user._id.toString()] = {
      name: p.user.name,
      avatar: p.user.avatar,
      level: p.level,
      xp: p.xp,
      badges: p.badges,
      streak: p.streak,
    };
  });

  const leaderboard = sessionAgg.map((entry, index) => ({
    rank: index + 1,
    studentId: entry._id,
    ...userMap[entry._id.toString()],
    periodXp: entry.totalXp,
    avgWpm: Math.round(entry.avgWpm || 0),
    avgAccuracy: Math.round(entry.avgAccuracy || 0),
    sessions: entry.sessions,
  }));

  if (leaderboard.length === 0) {
    return profiles.slice(0, 20).map((p, index) => ({
      rank: index + 1,
      studentId: p.user._id,
      name: p.user.name,
      avatar: p.user.avatar,
      level: p.level,
      xp: p.xp,
      badges: p.badges,
      streak: p.streak,
      periodXp: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      sessions: 0,
    }));
  }

  return leaderboard;
};

const getMyStats = async (studentId) => {
  const profile = await StudentProfile.findOne({ user: studentId })
    .populate("user", "name avatar");

  if (!profile) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentSessions, totalSessions] = await Promise.all([
    PracticeSession.find({ student: studentId, practicedAt: { $gte: thirtyDaysAgo } })
      .sort({ practicedAt: -1 }),
    PracticeSession.countDocuments({ student: studentId }),
  ]);

  return {
    profile: {
      xp: profile.xp,
      level: profile.level,
      streak: profile.streak,
      badges: profile.badges,
      performanceScore: profile.performanceScore,
      practiceHistory: profile.practiceHistory.slice(-30),
    },
    levelInfo: xpForNextLevel(profile.xp),
    recentSessions,
    totalSessions,
  };
};

module.exports = {
  calculateLevel,
  calculateXpEarned,
  awardXp,
  updateStreak,
  checkBadges,
  getLeaderboard,
  getMyStats,
  xpForNextLevel,
  BADGE_DEFINITIONS,
};