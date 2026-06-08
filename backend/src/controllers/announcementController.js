const Announcement = require("../models/Announcement");
const User = require("../models/User");
const { notifyAnnouncement } = require("../services/notificationService");

const formatAnnouncement = (doc, userId) => {
  const post = doc.toObject ? doc.toObject() : doc;
  const uid = userId?.toString();

  return {
    ...post,
    likeCount: post.likes?.length || 0,
    commentCount: post.comments?.length || 0,
    likedByMe: uid ? (post.likes || []).some((id) => id.toString() === uid) : false,
    pollOptions: (post.pollOptions || []).map((opt) => ({
      ...opt,
      voteCount: opt.votes?.length || 0,
      votedByMe: uid ? (opt.votes || []).some((id) => id.toString() === uid) : false,
    })),
    myPollVoteIndex:
      uid && post.type === "poll"
        ? (post.pollOptions || []).findIndex((opt) =>
            (opt.votes || []).some((id) => id.toString() === uid)
          )
        : -1,
  };
};

const getAnnouncements = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, parseInt(req.query.limit, 10) || 6);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Announcement.find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar role")
        .populate("comments.user", "name avatar role"),
      Announcement.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        announcements: posts.map((p) => formatAnnouncement(p, req.user._id)),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { type, caption, imageUrl, pollOptions, pollEndsAt } = req.body;

    if (!["text", "image", "poll"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid announcement type" });
    }

    if (type === "image" && !imageUrl) {
      return res.status(400).json({ success: false, message: "Image is required for image posts" });
    }

    if (type === "poll") {
      const options = Array.isArray(pollOptions) ? pollOptions.filter((o) => o?.text?.trim()) : [];
      if (options.length < 2) {
        return res.status(400).json({ success: false, message: "Poll needs at least 2 options" });
      }
    }

    if (type === "text" && !caption?.trim()) {
      return res.status(400).json({ success: false, message: "Caption is required for text posts" });
    }

    const payload = {
      author: req.user._id,
      type,
      caption: caption?.trim() || "",
      imageUrl: type === "image" ? imageUrl : undefined,
      pollEndsAt: type === "poll" && pollEndsAt ? new Date(pollEndsAt) : undefined,
      pollOptions:
        type === "poll"
          ? (pollOptions || [])
              .map((o) => ({ text: o.text.trim(), votes: [] }))
              .filter((o) => o.text)
          : [],
    };

    const post = await Announcement.create(payload);
    await post.populate("author", "name avatar role");

    const preview = post.caption?.slice(0, 80) || (post.type === "poll" ? "New poll posted" : "New photo posted");
    notifyAnnouncement(preview).catch((err) => console.warn("Announcement notify failed:", err.message));

    res.status(201).json({
      success: true,
      data: formatAnnouncement(post, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const post = await Announcement.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    post.isActive = false;
    await post.save();

    res.json({ success: true, message: "Announcement removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Announcement.findById(req.params.id);
    if (!post || !post.isActive) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    const uid = req.user._id;
    const idx = post.likes.findIndex((id) => id.toString() === uid.toString());
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(uid);
    }
    await post.save();

    res.json({
      success: true,
      data: {
        liked: idx < 0,
        likeCount: post.likes.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Announcement.findById(req.params.id);
    if (!post || !post.isActive || post.type !== "poll") {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    if (post.pollEndsAt && new Date() > post.pollEndsAt) {
      return res.status(400).json({ success: false, message: "Poll has ended" });
    }

    const idx = parseInt(optionIndex, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= post.pollOptions.length) {
      return res.status(400).json({ success: false, message: "Invalid poll option" });
    }

    const uid = req.user._id.toString();
    for (const opt of post.pollOptions) {
      opt.votes = opt.votes.filter((id) => id.toString() !== uid);
    }
    post.pollOptions[idx].votes.push(req.user._id);
    await post.save();

    res.json({
      success: true,
      data: formatAnnouncement(post, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const post = await Announcement.findById(req.params.id);
    if (!post || !post.isActive) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate("comments.user", "name avatar role");

    const comment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      data: {
        comment,
        commentCount: post.comments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const post = await Announcement.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments" });
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    res.json({
      success: true,
      data: { commentCount: post.comments.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleLike,
  votePoll,
  addComment,
  deleteComment,
};