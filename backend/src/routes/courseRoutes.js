const express = require("express");
const {
  getCourses,
  getCourseCategories,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getCourses);
router.get("/categories", getCourseCategories);
router.post("/", protect, authorize("admin"), createCourse);
router.put("/:id", protect, authorize("admin"), updateCourse);
router.delete("/:id", protect, authorize("admin"), deleteCourse);

module.exports = router;