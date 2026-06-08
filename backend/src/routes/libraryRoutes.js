const express = require("express");
const { getLibrary, addItem, deleteItem, streamMaterial } = require("../controllers/libraryController");
const { protect, protectStream, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getLibrary);
router.get("/:id/stream", protectStream, streamMaterial);
router.post("/", protect, authorize("admin", "teacher"), addItem);
router.delete("/:id", protect, authorize("admin", "teacher"), deleteItem);

module.exports = router;