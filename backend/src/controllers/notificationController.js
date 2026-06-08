const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const {
  createAndNotify,
  notifyFeeReminder,
  notifyExamReminder,
  notifyAchievement,
} = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, message: "Notification dismissed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ success: false, message: "token and platform are required" });
    }

    const deviceToken = await DeviceToken.findOneAndUpdate(
      { user: req.user._id, token },
      { user: req.user._id, token, platform },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: deviceToken, message: "Device token registered" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeDeviceToken = async (req, res) => {
  try {
    await DeviceToken.findOneAndDelete({ user: req.user._id, token: req.body.token });
    res.json({ success: true, message: "Device token removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { recipientId, title, message, type, link, push, phone } = req.body;

    if (!recipientId || !title || !message) {
      return res.status(400).json({ success: false, message: "recipientId, title, and message are required" });
    }

    const result = await createAndNotify(recipientId, {
      title,
      message,
      type,
      link,
      push: push !== false,
      phone,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createNotification = async (recipientId, title, message, type = "info", link) => {
  return Notification.create({ recipient: recipientId, title, message, type, link });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllRead,
  registerDeviceToken,
  removeDeviceToken,
  sendNotification,
  createNotification,
  notifyFeeReminder,
  notifyExamReminder,
  notifyAchievement,
};