const express = require("express");
const { uploadFile } = require("../controllers/uploadController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", protect, authorize("admin", "teacher", "student"), upload.single("file"), uploadFile);

module.exports = router;