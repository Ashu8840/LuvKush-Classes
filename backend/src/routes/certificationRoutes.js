const express = require("express");
const {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  startExam,
  submitExam,
} = require("../controllers/certificationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getPrograms);
router.get("/:id", protect, getProgramById);
router.post("/", protect, authorize("admin"), createProgram);
router.put("/:id", protect, authorize("admin"), updateProgram);
router.delete("/:id", protect, authorize("admin"), deleteProgram);
router.post("/:id/start-exam", protect, authorize("student"), startExam);
router.post("/:id/submit-exam", protect, authorize("student"), submitExam);

module.exports = router;