const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllRead,
  registerDeviceToken,
  removeDeviceToken,
  sendNotification,
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markAsRead);
router.post("/device-token", registerDeviceToken);
router.delete("/device-token", removeDeviceToken);
router.post("/send", authorize("admin", "teacher"), sendNotification);

module.exports = router;