const axios = require("axios");
const Library = require("../models/Library");
const StudentProfile = require("../models/StudentProfile");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { normalizeCloudinaryDeliveryUrl } = require("../utils/cloudinaryHelper");

const populateQuery = (query) =>
  query
    .populate("course", "name")
    .populate("batch", "name")
    .populate("teacher", "name")
    .populate("uploadedBy", "name");

const mapItemUrls = (items) => {
  const list = Array.isArray(items) ? items : [items];
  return list.map((item) => {
    const doc = item.toObject ? item.toObject() : { ...item };
    doc.url = normalizeCloudinaryDeliveryUrl(doc.url, doc.type);
    return doc;
  });
};

const userCanAccessItem = async (user, item) => {
  if (!item) return false;
  if (user.role === "admin") return true;

  const isPublic = !item.visibility || item.visibility === "public";
  if (isPublic) return true;

  if (item.visibility === "course") {
    if (user.role === "teacher") {
      return (
        item.teacher?.toString() === user._id.toString() ||
        item.uploadedBy?.toString() === user._id.toString()
      );
    }
    if (user.role === "student") {
      const profile = await StudentProfile.findOne({ user: user._id }).select("teacher batch");
      if (!profile?.teacher || profile.teacher.toString() !== item.teacher?.toString()) {
        return false;
      }
      if (!item.batch) return true;
      return !profile.batch || item.batch.toString() === profile.batch.toString();
    }
  }

  return false;
};

const buildStudentCourseFilter = async (userId) => {
  const profile = await StudentProfile.findOne({ user: userId }).select("teacher batch course");
  if (!profile?.teacher) {
    return { _id: null };
  }
  const filter = {
    visibility: "course",
    teacher: profile.teacher,
  };
  if (profile.batch) {
    filter.$or = [{ batch: null }, { batch: { $exists: false } }, { batch: profile.batch }];
  }
  return filter;
};

const getLibrary = async (req, res) => {
  try {
    const conditions = [];
    const visibility = req.query.visibility;

    if (req.query.type) conditions.push({ type: req.query.type });
    if (req.query.category) conditions.push({ category: req.query.category });
    if (req.query.search) {
      conditions.push({
        $or: [
          { title: { $regex: req.query.search, $options: "i" } },
          { tags: { $regex: req.query.search, $options: "i" } },
        ],
      });
    }

    if (visibility === "public") {
      conditions.push({
        $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
      });
    } else if (visibility === "course") {
      if (req.user.role === "teacher") {
        conditions.push({ visibility: "course", teacher: req.user._id });
      } else if (req.user.role === "student") {
        conditions.push(await buildStudentCourseFilter(req.user._id));
      } else if (req.user.role === "admin") {
        conditions.push({ visibility: "course" });
      }
    } else if (req.user.role === "student") {
      const courseFilter = await buildStudentCourseFilter(req.user._id);
      conditions.push({
        $or: [
          { visibility: "public" },
          { visibility: { $exists: false } },
          courseFilter,
        ],
      });
    } else if (req.user.role === "teacher") {
      conditions.push({
        $or: [
          { visibility: "public" },
          { visibility: { $exists: false } },
          { visibility: "course", teacher: req.user._id },
        ],
      });
    }

    const filter = conditions.length ? { $and: conditions } : {};

    const { page, limit, skip, isPaginated } = parsePagination(req.query, 5);
    const baseQuery = populateQuery(Library.find(filter).sort({ createdAt: -1 }));

    if (isPaginated || req.query.limit) {
      const [items, total] = await Promise.all([
        baseQuery.clone().skip(skip).limit(limit),
        Library.countDocuments(filter),
      ]);
      return res.json({
        success: true,
        data: { items: mapItemUrls(items), pagination: paginationMeta(total, page, limit) },
      });
    }

    const items = await baseQuery;
    res.json({ success: true, data: mapItemUrls(items) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const visibility = req.body.visibility === "course" ? "course" : "public";
    const payload = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      category: req.body.category,
      url: normalizeCloudinaryDeliveryUrl(req.body.url, req.body.type),
      tags: req.body.tags,
      course: req.body.course || undefined,
      batch: req.body.batch || req.body.batchId || undefined,
      visibility,
      uploadedBy: req.user._id,
    };

    if (visibility === "course") {
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Only teachers can add course modules" });
      }
      payload.teacher = req.user._id;
    }

    const item = await Library.create(payload);
    const populated = await populateQuery(Library.findById(item._id));
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Library.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    if (
      req.user.role === "teacher" &&
      item.uploadedBy?.toString() !== req.user._id.toString() &&
      item.teacher?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "You can only delete your own items" });
    }
    await Library.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const streamMaterial = async (req, res) => {
  try {
    const item = await Library.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const allowed = await userCanAccessItem(req.user, item);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const primaryUrl = normalizeCloudinaryDeliveryUrl(item.url, item.type);
    const fallbackUrl =
      primaryUrl !== item.url
        ? item.url
        : item.url.replace("/image/upload/", "/raw/upload/");

    const tryStream = async (url) =>
      axios({
        method: "GET",
        url,
        responseType: "stream",
        timeout: 60000,
        validateStatus: (s) => s >= 200 && s < 300,
      });

    let response;
    try {
      response = await tryStream(primaryUrl);
    } catch {
      try {
        response = await tryStream(fallbackUrl);
      } catch {
        return res.status(502).json({ success: false, message: "Failed to fetch material from storage" });
      }
    }

    const typeMap = {
      pdf: "application/pdf",
      paper: "application/pdf",
      video: "video/mp4",
      audio: "audio/mpeg",
      note: "text/plain",
    };

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || typeMap[item.type] || "application/octet-stream"
    );
    res.setHeader("Cache-Control", "private, max-age=3600");
    response.data.pipe(res);
  } catch (error) {
    res.status(502).json({ success: false, message: error.message || "Failed to stream material" });
  }
};

module.exports = { getLibrary, addItem, deleteItem, streamMaterial };