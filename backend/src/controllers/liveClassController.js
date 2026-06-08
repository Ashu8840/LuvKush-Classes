const LiveClass = require("../models/LiveClass");
const Batch = require("../models/Batch");
const crypto = require("crypto");

const generateRoomId = () => `luvkush-${crypto.randomBytes(8).toString("hex")}`;

const populateClass = (query) =>
  query
    .populate("batch", "name timing")
    .populate("teacher", "name avatar")
    .populate("sessionParticipants.user", "name avatar role")
    .populate("chatMessages.user", "name avatar role")
    .populate("blockedUsers", "name");

const formatClass = (doc) => {
  const c = doc.toObject ? doc.toObject() : doc;
  return {
    ...c,
    participantCount: c.sessionParticipants?.filter((p) => p.status === "admitted").length || 0,
    waitingCount: c.sessionParticipants?.filter((p) => p.status === "waiting").length || 0,
  };
};

const assertTeacher = (liveClass, userId) => {
  if (liveClass.teacher.toString() !== userId.toString()) {
    const err = new Error("Only the class teacher can perform this action");
    err.status = 403;
    throw err;
  }
};

const getLiveClasses = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "teacher") filter.teacher = req.user._id;
    if (req.user.role === "student") {
      const batches = await Batch.find({ students: req.user._id }).select("_id");
      filter.$or = [
        { batch: { $in: batches.map((b) => b._id) } },
        { batch: null },
      ];
      filter.status = { $in: ["scheduled", "live"] };
    }
    if (req.query.status) filter.status = req.query.status;

    const classes = await populateClass(LiveClass.find(filter).sort({ scheduledAt: -1 }));
    res.json({ success: true, data: classes.map(formatClass) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLiveClass = async (req, res) => {
  try {
    const liveClass = await populateClass(LiveClass.findById(req.params.id));
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, data: formatClass(liveClass) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const scheduleClass = async (req, res) => {
  try {
    const {
      title,
      description,
      batchId,
      scheduledAt,
      duration,
      waitingRoomEnabled,
      chatEnabled,
      handRaiseEnabled,
      screenShareEnabled,
    } = req.body;

    if (!title?.trim() || !scheduledAt) {
      return res.status(400).json({ success: false, message: "Title and scheduled time are required" });
    }

    const liveClass = await LiveClass.create({
      title: title.trim(),
      description: description?.trim(),
      batch: batchId || undefined,
      teacher: req.user._id,
      roomId: generateRoomId(),
      status: "scheduled",
      scheduledAt: new Date(scheduledAt),
      duration: Number(duration) || 60,
      waitingRoomEnabled: waitingRoomEnabled !== false,
      chatEnabled: chatEnabled !== false,
      handRaiseEnabled: handRaiseEnabled !== false,
      screenShareEnabled: screenShareEnabled !== false,
    });

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.status(201).json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startClass = async (req, res) => {
  try {
    const { title, batchId, classId } = req.body;

    let liveClass;
    if (classId) {
      liveClass = await LiveClass.findById(classId);
      if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
      assertTeacher(liveClass, req.user._id);
      liveClass.status = "live";
      liveClass.startedAt = new Date();
      await liveClass.save();
    } else {
      liveClass = await LiveClass.create({
        title: title || "Live Class",
        batch: batchId,
        teacher: req.user._id,
        roomId: generateRoomId(),
        status: "live",
        scheduledAt: new Date(),
        startedAt: new Date(),
      });
    }

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.status(201).json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const goLive = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);

    liveClass.status = "live";
    liveClass.startedAt = new Date();
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const endClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);

    liveClass.status = "ended";
    liveClass.endedAt = new Date();
    await liveClass.save();

    res.json({ success: true, data: liveClass });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);
    await LiveClass.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Class deleted" });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const joinClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({ roomId: req.params.roomId });
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

    if (liveClass.blockedUsers.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You are blocked from this class" });
    }

    const existing = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (req.user.role === "teacher" && liveClass.teacher.toString() === req.user._id.toString()) {
      if (!existing) {
        liveClass.sessionParticipants.push({
          user: req.user._id,
          status: "admitted",
          joinedAt: new Date(),
        });
      } else {
        existing.status = "admitted";
        existing.joinedAt = new Date();
      }
    } else if (!existing) {
      liveClass.sessionParticipants.push({
        user: req.user._id,
        status: liveClass.waitingRoomEnabled ? "waiting" : "admitted",
        joinedAt: new Date(),
      });
    } else if (existing.status === "kicked") {
      return res.status(403).json({ success: false, message: "You were removed from this class" });
    }

    if (!liveClass.participants.includes(req.user._id)) {
      liveClass.participants.push(req.user._id);
    }
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestJoin = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

    if (liveClass.blockedUsers.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You are blocked from this class" });
    }

    const existing = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (existing?.status === "kicked") {
      return res.status(403).json({ success: false, message: "You were removed from this class" });
    }

    if (!existing) {
      liveClass.sessionParticipants.push({
        user: req.user._id,
        status: liveClass.waitingRoomEnabled && liveClass.status === "live" ? "waiting" : "admitted",
        joinedAt: new Date(),
      });
    }

    if (!liveClass.participants.includes(req.user._id)) {
      liveClass.participants.push(req.user._id);
    }
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const admitParticipant = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);

    const participant = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.params.userId
    );
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    participant.status = "admitted";
    participant.joinedAt = new Date();
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const kickParticipant = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);

    const participant = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.params.userId
    );
    if (participant) {
      participant.status = "kicked";
      participant.handRaised = false;
    }
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const blockParticipant = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);

    if (!liveClass.blockedUsers.some((id) => id.toString() === req.params.userId)) {
      liveClass.blockedUsers.push(req.params.userId);
    }

    const participant = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.params.userId
    );
    if (participant) {
      participant.status = "kicked";
      participant.handRaised = false;
    }
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const sendChat = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Message is required" });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    if (!liveClass.chatEnabled) return res.status(403).json({ success: false, message: "Chat is disabled" });

    const participant = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );
    const isTeacher = liveClass.teacher.toString() === req.user._id.toString();
    if (!isTeacher && (!participant || participant.status !== "admitted")) {
      return res.status(403).json({ success: false, message: "Join the class to chat" });
    }

    liveClass.chatMessages.push({ user: req.user._id, text: text.trim() });
    if (liveClass.chatMessages.length > 200) {
      liveClass.chatMessages = liveClass.chatMessages.slice(-200);
    }
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleHandRaise = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    if (!liveClass.handRaiseEnabled) {
      return res.status(403).json({ success: false, message: "Hand raise is disabled" });
    }

    const participant = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (!participant || participant.status !== "admitted") {
      return res.status(403).json({ success: false, message: "You must be admitted to raise hand" });
    }

    participant.handRaised = !participant.handRaised;
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const muteParticipant = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    assertTeacher(liveClass, req.user._id);

    const participant = liveClass.sessionParticipants.find(
      (p) => p.user.toString() === req.params.userId
    );
    if (participant) participant.isMuted = !participant.isMuted;
    await liveClass.save();

    const populated = await populateClass(LiveClass.findById(liveClass._id));
    res.json({ success: true, data: formatClass(populated) });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLiveClasses,
  getLiveClass,
  scheduleClass,
  startClass,
  goLive,
  endClass,
  deleteClass,
  joinClass,
  requestJoin,
  admitParticipant,
  kickParticipant,
  blockParticipant,
  sendChat,
  toggleHandRaise,
  muteParticipant,
};