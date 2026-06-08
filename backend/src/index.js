require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const routes = require("./routes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://luvkush.vercel.app",
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o.replace(/\/$/, ""))) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Luv Kush Classes API" });
});

let isConnected = false;

const ensureDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await connectDB();
  isConnected = true;
};

const startServer = async () => {
  try {
    await ensureDB();
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || "0.0.0.0";
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Expo Go / LAN: use http://<your-wifi-ip>:${PORT}/api in mobile app`);
      console.log("Phone and laptop must be on the same Wi-Fi network.");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    try {
      await ensureDB();
      return app(req, res);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
} else {
  startServer();
}

module.exports = app;