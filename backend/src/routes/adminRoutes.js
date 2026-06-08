const express = require("express");
const {
  getDashboard,
  getStudents,
  createStudent,
  updateStudent,
  archiveStudent,
  getDatabase,
  deleteArchivedRecord,
  getPersonRecord,
  getTeachers,
  createTeacher,
  updateTeacher,
  archiveTeacher,
  createParent,
  linkParentToStudent,
  getParents,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/database", getDatabase);
router.get("/records/:userId", getPersonRecord);
router.delete("/records/:userId", deleteArchivedRecord);
router.get("/students", getStudents);
router.post("/students", createStudent);
router.put("/students/:userId", updateStudent);
router.delete("/students/:userId", archiveStudent);
router.get("/teachers", getTeachers);
router.post("/teachers", createTeacher);
router.put("/teachers/:userId", updateTeacher);
router.delete("/teachers/:userId", archiveTeacher);
router.get("/parents", getParents);
router.post("/parents", createParent);
router.post("/parents/link", linkParentToStudent);

module.exports = router;