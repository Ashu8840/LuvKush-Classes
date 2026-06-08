const express = require("express");
const {
  createDictation,
  getDictations,
  getDictationById,
  updateDictation,
  deleteDictation,
  submitAttempt,
  getMyAttempts,
  getProgress,
} = require("../controllers/shorthandController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getDictations);
router.get("/progress", protect, authorize("student"), getProgress);
router.get("/progress/student/:studentId", protect, authorize("admin", "teacher"), getProgress);
router.get("/attempts", protect, authorize("student"), getMyAttempts);
router.get("/:id", protect, getDictationById);
router.post("/", protect, authorize("admin", "teacher"), createDictation);
router.put("/:id", protect, authorize("admin", "teacher"), updateDictation);
router.delete("/:id", protect, authorize("admin", "teacher"), deleteDictation);
router.post("/:id/attempt", protect, authorize("student"), submitAttempt);

module.exports = router;