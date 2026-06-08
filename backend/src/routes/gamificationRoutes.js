const express = require("express");
const {
  getLeaderboardHandler,
  getAchievements,
  getMyStatsHandler,
} = require("../controllers/gamificationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/leaderboard", getLeaderboardHandler);
router.get("/achievements", authorize("student"), getAchievements);
router.get("/my-stats", authorize("student"), getMyStatsHandler);

module.exports = router;