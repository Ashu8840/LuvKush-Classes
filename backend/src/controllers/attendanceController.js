const Attendance = require("../models/Attendance");
const StudentProfile = require("../models/StudentProfile");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const buildAttendanceFilter = (query) => {
  const filter = {};
  if (query.studentId) filter.student = query.studentId;
  if (query.batchId) filter.batch = query.batchId;

  if (query.date) {
    const d = new Date(query.date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  } else if (query.fromDate || query.toDate) {
    filter.date = {};
    if (query.fromDate) {
      const from = new Date(query.fromDate);
      from.setHours(0, 0, 0, 0);
      filter.date.$gte = from;
    }
    if (query.toDate) {
      const to = new Date(query.toDate);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  return filter;
};

const computeStats = async (filter) => {
  const [total, present, absent, late, leave] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.countDocuments({ ...filter, status: "present" }),
    Attendance.countDocuments({ ...filter, status: "absent" }),
    Attendance.countDocuments({ ...filter, status: "late" }),
    Attendance.countDocuments({ ...filter, status: "leave" }),
  ]);
  return { total, present, absent, late, leave };
};

const markAttendance = async (req, res) => {
  try {
    const { studentId, batchId, date, status, method, remarks } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, date: new Date(date) },
      {
        student: studentId,
        batch: batchId,
        date: new Date(date),
        status: status || "present",
        method: method || "manual",
        markedBy: req.user._id,
        remarks,
      },
      { upsert: true, new: true }
    );

    const total = await Attendance.countDocuments({ student: studentId });
    const present = await Attendance.countDocuments({
      student: studentId,
      status: { $in: ["present", "late"] },
    });
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    await StudentProfile.findOneAndUpdate(
      { user: studentId },
      { attendancePercent: percent }
    );

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const filter = buildAttendanceFilter(req.query);
    const { page, limit, skip, isPaginated } = parsePagination(req.query, 6);

    if (isPaginated) {
      const [records, total, stats] = await Promise.all([
        Attendance.find(filter)
          .populate("student", "name email")
          .populate("batch", "name")
          .populate("markedBy", "name role")
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Attendance.countDocuments(filter),
        computeStats(filter),
      ]);

      return res.json({
        success: true,
        data: {
          records,
          pagination: paginationMeta(total, page, limit),
          stats,
        },
      });
    }

    const records = await Attendance.find(filter)
      .populate("student", "name email")
      .populate("batch", "name")
      .populate("markedBy", "name role")
      .sort({ date: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markBulkAttendance = async (req, res) => {
  try {
    const { batchId, date, records } = req.body;
    const attendanceDate = new Date(date || Date.now());
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];

    for (const record of records) {
      const attendance = await Attendance.findOneAndUpdate(
        { student: record.studentId, date: attendanceDate },
        {
          student: record.studentId,
          batch: batchId,
          date: attendanceDate,
          status: record.status || "present",
          method: record.method || "manual",
          markedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
      results.push(attendance);

      const total = await Attendance.countDocuments({ student: record.studentId });
      const present = await Attendance.countDocuments({
        student: record.studentId,
        status: { $in: ["present", "late"] },
      });
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;
      await StudentProfile.findOneAndUpdate(
        { user: record.studentId },
        { attendancePercent: percent }
      );
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const filter = buildAttendanceFilter(req.query);
    const records = await Attendance.find(filter)
      .populate("student", "name email")
      .populate("batch", "name")
      .populate("markedBy", "name role")
      .sort({ date: -1, createdAt: -1 });

    const headers = ["Student", "Email", "Batch", "Date", "Status", "Method", "Marked By", "Marked At"];
    const rows = records.map((r) => [
      r.student?.name || "",
      r.student?.email || "",
      r.batch?.name || "",
      r.date ? new Date(r.date).toISOString().split("T")[0] : "",
      r.status,
      r.method,
      r.markedBy?.name || "",
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
    ]);

    const escape = (val) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const from = req.query.fromDate || req.query.date || "all";
    const to = req.query.toDate || req.query.date || "all";
    const batch = req.query.batchId ? "batch" : "all";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="attendance-${batch}-${from}-to-${to}.csv"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTodayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMarkList = async (req, res) => {
  try {
    const { batchId } = req.query;
    const today = getTodayStart();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const studentFilter = { teacher: req.user._id };
    if (batchId) studentFilter.batch = batchId;

    const students = await StudentProfile.find(studentFilter)
      .populate("user", "name email avatar")
      .populate("batch course", "name title");

    const studentIds = students.map((s) => s.user._id);
    const markedRecords = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: today, $lt: tomorrow },
    }).select("student status");

    const markedIds = new Set(markedRecords.map((r) => r.student.toString()));
    const unmarked = students.filter((s) => !markedIds.has(s.user._id.toString()));

    res.json({
      success: true,
      data: {
        students: unmarked,
        markedCount: markedRecords.length,
        totalStudents: students.length,
        date: today,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { markAttendance, getAttendance, markBulkAttendance, exportAttendance, getMarkList };