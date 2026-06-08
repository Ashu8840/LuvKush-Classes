const express = require("express");
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleLike,
  votePoll,
  addComment,
  deleteComment,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "teacher", "student"));

router.get("/", getAnnouncements);
router.post("/", authorize("admin"), createAnnouncement);
router.delete("/:id", authorize("admin"), deleteAnnouncement);
router.post("/:id/like", toggleLike);
router.post("/:id/vote", votePoll);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

module.exports = router;