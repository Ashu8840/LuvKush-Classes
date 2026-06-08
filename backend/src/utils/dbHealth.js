const mongoose = require("mongoose");
const connectDB = require("../config/db");

const pingDatabase = async () => {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }

  const started = Date.now();
  await mongoose.connection.db.admin().command({ ping: 1 });
  const latencyMs = Date.now() - started;

  return {
    status: "connected",
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    latencyMs,
  };
};

module.exports = { pingDatabase };