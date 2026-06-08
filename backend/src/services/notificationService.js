const axios = require("axios");
const DeviceToken = require("../models/DeviceToken");
const Notification = require("../models/Notification");

let firebaseAdmin = null;
let messaging = null;

const initFirebase = () => {
  if (firebaseAdmin) return messaging;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    firebaseAdmin = require("firebase-admin");
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    messaging = firebaseAdmin.messaging();
    return messaging;
  } catch (err) {
    console.warn("Firebase not configured:", err.message);
    return null;
  }
};

const sendPushNotification = async (userId, { title, body, data = {} }) => {
  const fcm = initFirebase();
  if (!fcm) return { sent: false, reason: "firebase_not_configured" };

  const tokens = await DeviceToken.find({ user: userId });
  if (!tokens.length) return { sent: false, reason: "no_tokens" };

  const results = [];
  for (const { token } of tokens) {
    try {
      await fcm.send({
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      });
      results.push({ token, success: true });
    } catch (err) {
      results.push({ token, success: false, error: err.message });
    }
  }

  return { sent: results.some((r) => r.success), results };
};

const sendWhatsApp = async (phone, variables = {}) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !senderId || !templateId || !phone) {
    return { sent: false, reason: "msg91_not_configured" };
  }

  try {
    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      {
        template_id: templateId,
        short_url: "0",
        recipients: [
          {
            mobiles: phone.replace(/\D/g, ""),
            ...variables,
          },
        ],
      },
      {
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
      }
    );

    return { sent: true, data: response.data };
  } catch (err) {
    console.warn("WhatsApp send failed:", err.message);
    return { sent: false, reason: err.message };
  }
};

const createAndNotify = async (recipientId, { title, message, type = "info", link, push = true, phone, whatsappVars }) => {
  const notification = await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    link,
  });

  const results = { notification };

  if (push) {
    results.push = await sendPushNotification(recipientId, {
      title,
      body: message,
      data: { type, link: link || "", notificationId: notification._id.toString() },
    });
  }

  if (phone) {
    results.whatsapp = await sendWhatsApp(phone, {
      var1: title,
      var2: message,
      ...whatsappVars,
    });
  }

  return results;
};

const notifyFeeReminder = async (studentId, phone, amount, dueDate) => {
  return createAndNotify(studentId, {
    title: "Fee Reminder",
    message: `₹${amount} fee due by ${new Date(dueDate).toLocaleDateString()}`,
    type: "fee",
    link: "/student/fees",
    phone,
    whatsappVars: { var1: String(amount), var2: new Date(dueDate).toLocaleDateString() },
  });
};

const notifyExamReminder = async (studentId, examTitle, scheduledAt) => {
  return createAndNotify(studentId, {
    title: "Upcoming Exam",
    message: `${examTitle} on ${new Date(scheduledAt).toLocaleDateString()}`,
    type: "exam",
    link: "/student/exams",
  });
};

const notifyAchievement = async (studentId, badgeName) => {
  return createAndNotify(studentId, {
    title: "Achievement Unlocked!",
    message: `You earned the "${badgeName}" badge!`,
    type: "achievement",
    link: "/student/achievements",
  });
};

const notifyPaymentSuccess = async (studentId, amount, receiptNumber) => {
  return createAndNotify(studentId, {
    title: "Payment Successful",
    message: `₹${amount} paid. Receipt: ${receiptNumber}`,
    type: "fee",
    link: "/student/fees",
  });
};

const notifyAdminsPaymentPending = async (studentName, amount, utr) => {
  const User = require("../models/User");
  const admins = await User.find({ role: "admin", isActive: true }).select("_id");
  if (!admins.length) return { notified: 0 };

  const title = "Payment Verification Required";
  const message = `${studentName} submitted ₹${amount} — UTR: ${utr}`;
  const docs = admins.map((admin) => ({
    recipient: admin._id,
    title,
    message,
    type: "fee",
    link: "/admin/fees",
  }));

  await Notification.insertMany(docs);
  await Promise.allSettled(
    admins.map((admin) =>
      sendPushNotification(admin._id, {
        title,
        body: message,
        data: { type: "fee", link: "/admin/fees" },
      })
    )
  );

  return { notified: admins.length };
};

const notifyAnnouncement = async (preview) => {
  const User = require("../models/User");
  const users = await User.find({
    role: { $in: ["student", "teacher"] },
    isActive: true,
  }).select("_id role");

  if (!users.length) return { notified: 0 };

  const title = "New Announcement";
  const message = preview || "Admin posted a new announcement";
  const docs = users.map((u) => ({
    recipient: u._id,
    title,
    message,
    type: "announcement",
    link: `/${u.role}/announcements`,
  }));

  const notifications = await Notification.insertMany(docs);

  await Promise.allSettled(
    users.map((u) =>
      sendPushNotification(u._id, {
        title,
        body: message,
        data: { type: "announcement", link: `/${u.role}/announcements` },
      })
    )
  );

  return { notified: notifications.length };
};

module.exports = {
  initFirebase,
  sendPushNotification,
  sendWhatsApp,
  createAndNotify,
  notifyFeeReminder,
  notifyExamReminder,
  notifyAchievement,
  notifyPaymentSuccess,
  notifyAdminsPaymentPending,
  notifyAnnouncement,
};