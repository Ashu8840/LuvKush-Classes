const express = require("express");
const {
  createPassage,
  getPassages,
  getPassageById,
  updatePassage,
  deletePassage,
  generatePassage,
  getMySessions,
  analyzeTyping,
} = require("../controllers/typingController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/passages", protect, getPassages);
router.post("/passages/generate", protect, authorize("admin", "teacher"), generatePassage);
router.post("/passages", protect, authorize("admin", "teacher"), createPassage);
router.get("/passages/:id", protect, getPassageById);
router.put("/passages/:id", protect, authorize("admin", "teacher"), updatePassage);
router.delete("/passages/:id", protect, authorize("admin", "teacher"), deletePassage);

router.get("/sessions", protect, authorize("student"), getMySessions);
router.get("/analyze", protect, authorize("student"), analyzeTyping);

module.exports = router;