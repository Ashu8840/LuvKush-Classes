const mongoose = require("mongoose");

const sessionParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["waiting", "admitted", "kicked"],
      default: "waiting",
    },
    handRaised: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    joinedAt: Date,
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    startedAt: Date,
    endedAt: Date,
    recordingUrl: String,
    waitingRoomEnabled: { type: Boolean, default: true },
    chatEnabled: { type: Boolean, default: true },
    handRaiseEnabled: { type: Boolean, default: true },
    screenShareEnabled: { type: Boolean, default: true },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sessionParticipants: [sessionParticipantSchema],
    chatMessages: [chatMessageSchema],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);