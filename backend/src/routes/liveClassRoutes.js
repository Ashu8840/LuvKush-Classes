const express = require("express");
const {
  getLiveClasses,
  getLiveClass,
  scheduleClass,
  startClass,
  goLive,
  endClass,
  deleteClass,
  joinClass,
  requestJoin,
  admitParticipant,
  kickParticipant,
  blockParticipant,
  sendChat,
  toggleHandRaise,
  muteParticipant,
} = require("../controllers/liveClassController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getLiveClasses);
router.get("/:id", getLiveClass);
router.post("/schedule", authorize("teacher", "admin"), scheduleClass);
router.post("/start", authorize("teacher", "admin"), startClass);
router.post("/:id/go-live", authorize("teacher", "admin"), goLive);
router.post("/:id/end", authorize("teacher", "admin"), endClass);
router.delete("/:id", authorize("teacher", "admin"), deleteClass);
router.post("/join/:roomId", joinClass);
router.post("/:id/join", requestJoin);
router.post("/:id/admit/:userId", authorize("teacher", "admin"), admitParticipant);
router.post("/:id/kick/:userId", authorize("teacher", "admin"), kickParticipant);
router.post("/:id/block/:userId", authorize("teacher", "admin"), blockParticipant);
router.post("/:id/chat", sendChat);
router.post("/:id/hand-raise", toggleHandRaise);
router.post("/:id/mute/:userId", authorize("teacher", "admin"), muteParticipant);

module.exports = router;