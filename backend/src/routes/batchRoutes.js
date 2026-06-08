const express = require("express");
const {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} = require("../controllers/batchController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getBatches);
router.post("/", protect, authorize("admin"), createBatch);
router.put("/:id", protect, authorize("admin"), updateBatch);
router.delete("/:id", protect, authorize("admin"), deleteBatch);

module.exports = router;