const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const TeacherProfile = require("../models/TeacherProfile");
const Course = require("../models/Course");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Exam = require("../models/Exam");
const Certificate = require("../models/Certificate");
const ParentLink = require("../models/ParentLink");
const ExamAttempt = require("../models/ExamAttempt");
const Payment = require("../models/Payment");
const PracticeSession = require("../models/PracticeSession");
const ShorthandAttempt = require("../models/ShorthandAttempt");
const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const LiveClass = require("../models/LiveClass");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const getPendingFeesAmount = async () => {
  const [feeAgg, studentsWithFees] = await Promise.all([
    Fee.aggregate([
      { $match: { status: { $in: ["pending", "partial", "overdue"] } } },
      {
        $group: {
          _id: null,
          amount: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Fee.distinct("student"),
  ]);

  const profileAgg = await StudentProfile.aggregate([
    {
      $match: {
        user: { $nin: studentsWithFees },
        $expr: { $gt: [{ $subtract: ["$totalFees", { $ifNull: ["$paidFees", 0] }] }, 0] },
      },
    },
    {
      $group: {
        _id: null,
        amount: { $sum: { $subtract: ["$totalFees", { $ifNull: ["$paidFees", 0] }] } },
      },
    },
  ]);

  const feeAmount = feeAgg[0]?.amount || 0;
  const profileAmount = profileAgg[0]?.amount || 0;
  return {
    pendingFees: feeAmount + profileAmount,
    pendingFeesCount: feeAgg[0]?.count || 0,
  };
};

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingFeeStats = await getPendingFeesAmount();

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      todayAttendance,
      upcomingExams,
      feesCollected,
      courseEnrollments,
      recentStudents,
      liveClasses,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: "present" }),
      Exam.countDocuments({ scheduledAt: { $gte: new Date() }, isPublished: true }),
      Fee.aggregate([{ $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
      StudentProfile.countDocuments({ course: { $ne: null } }),
      User.find({ role: "student" }).sort({ createdAt: -1 }).limit(5).select("name email createdAt"),
      LiveClass.countDocuments({ status: "live" }),
    ]);

    const revenueData = await Fee.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$paidAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          totalTeachers,
          todayAttendance,
          upcomingExams,
          feesCollected: feesCollected[0]?.total || 0,
          pendingFees: pendingFeeStats.pendingFees,
          pendingFeesCount: pendingFeeStats.pendingFeesCount,
          liveClasses,
          courseEnrollments,
        },
        revenueData,
        recentStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const { page, limit, skip, isPaginated } = parsePagination(req.query);
    const filter = { role: "student", isArchived: { $ne: true } };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const studentsQuery = User.find(filter).select("-password").sort({ createdAt: -1 });
    const [students, total] = isPaginated
      ? await Promise.all([studentsQuery.skip(skip).limit(limit), User.countDocuments(filter)])
      : [await studentsQuery, null];

    const userIds = students.map((s) => s._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } })
      .populate("user", "name email phone avatar isActive isArchived recoverablePassword")
      .populate("course batch teacher", "name");

    const data = { students, profiles };
    if (isPaginated) data.pagination = paginationMeta(total, page, limit);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const syncStudentEnrollment = async (userId, profileData = {}) => {
  const updates = { ...profileData };
  const { course, batch, teacher } = profileData;

  if (batch) {
    const batchDoc = await Batch.findById(batch);
    if (batchDoc) {
      updates.batch = batch;
      if (batchDoc.course) updates.course = batchDoc.course;
      if (batchDoc.teacher) updates.teacher = batchDoc.teacher;
      await Batch.findByIdAndUpdate(batch, { $addToSet: { students: userId } });
    }
  } else if (course) {
    updates.course = course;
  }

  if (teacher && !updates.teacher) updates.teacher = teacher;

  return updates;
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, ...profileData } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role: "student",
      phone,
    });

    const enrollment = await syncStudentEnrollment(user._id, profileData);
    const profile = await StudentProfile.create({
      user: user._id,
      ...enrollment,
    });

    const totalFees = Number(profileData.totalFees) || 0;
    if (totalFees > 0) {
      const due = new Date();
      due.setDate(due.getDate() + 30);
      await Fee.create({
        student: user._id,
        amount: totalFees,
        paidAmount: 0,
        dueDate: due,
        status: "pending",
        remarks: "Initial enrollment fee",
        recordedBy: req.user._id,
      });
    }

    res.status(201).json({
      success: true,
      data: { user: { id: user._id, name, email, phone, role: "student" }, profile },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, isActive, ...profileData } = req.body;

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (isActive !== undefined) userUpdates.isActive = isActive;

    const user = await User.findByIdAndUpdate(userId, userUpdates, { new: true }).select("-password");

    let profile;
    if (Object.keys(profileData).length) {
      const enrollment = await syncStudentEnrollment(userId, profileData);
      profile = await StudentProfile.findOneAndUpdate({ user: userId }, enrollment, { new: true }).populate("course batch teacher", "name");
    } else {
      profile = await StudentProfile.findOne({ user: userId }).populate("course batch teacher", "name");
    }

    res.json({ success: true, data: { user, profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const archiveStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, {
      isArchived: true,
      isActive: false,
      archivedAt: new Date(),
    });
    await Batch.updateMany({ students: userId }, { $pull: { students: userId } });
    res.json({
      success: true,
      message: "Student archived to database. All records preserved permanently.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDatabase = async (req, res) => {
  try {
    const { search, role } = req.query;
    const { page, limit, skip, isPaginated } = parsePagination(req.query, 12);
    const filter = { isArchived: true };
    if (role === "student" || role === "teacher") filter.role = role;
    else filter.role = { $in: ["student", "teacher"] };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const usersQuery = User.find(filter).select("-password").sort({ archivedAt: -1 });
    const [users, total] = isPaginated
      ? await Promise.all([usersQuery.skip(skip).limit(limit), User.countDocuments(filter)])
      : [await usersQuery, null];

    const studentIds = users.filter((u) => u.role === "student").map((u) => u._id);
    const teacherIds = users.filter((u) => u.role === "teacher").map((u) => u._id);

    const [studentProfiles, teacherProfiles] = await Promise.all([
      StudentProfile.find({ user: { $in: studentIds } })
        .populate("user", "name email phone isActive isArchived archivedAt")
        .populate("course batch", "name"),
      TeacherProfile.find({ user: { $in: teacherIds } })
        .populate("user", "name email phone isActive isArchived archivedAt")
        .populate("batches", "name"),
    ]);

    const data = { users, studentProfiles, teacherProfiles };
    if (isPaginated) data.pagination = paginationMeta(total, page, limit);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteArchivedRecord = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    if (!user.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Only archived records can be permanently deleted from the database",
      });
    }

    if (user.role === "student") {
      await Promise.all([
        StudentProfile.deleteOne({ user: userId }),
        Attendance.deleteMany({ student: userId }),
        Fee.deleteMany({ student: userId }),
        ExamAttempt.deleteMany({ student: userId }),
        Certificate.deleteMany({ student: userId }),
        Payment.deleteMany({ student: userId }),
        PracticeSession.deleteMany({ student: userId }),
        ShorthandAttempt.deleteMany({ student: userId }),
        ParentLink.deleteMany({ student: userId }),
        Notification.deleteMany({ recipient: userId }),
        DeviceToken.deleteMany({ user: userId }),
        Batch.updateMany({ students: userId }, { $pull: { students: userId } }),
      ]);
    } else if (user.role === "teacher") {
      await Promise.all([
        TeacherProfile.deleteOne({ user: userId }),
        Batch.updateMany({ teacher: userId }, { $unset: { teacher: "" } }),
        Notification.deleteMany({ recipient: userId }),
        DeviceToken.deleteMany({ user: userId }),
      ]);
    } else {
      return res.status(400).json({
        success: false,
        message: "Only archived student or teacher records can be deleted",
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: `Archived ${user.role} record permanently deleted`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPersonRecord = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let profile = null;
    let attendance = [];
    let fees = [];
    let certificates = [];

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: userId })
        .populate("course batch teacher", "name");
      [attendance, fees, certificates] = await Promise.all([
        Attendance.find({ student: userId }).sort({ date: -1 }).limit(200).populate("batch", "name"),
        Fee.find({ student: userId }).sort({ createdAt: -1 }),
        Certificate.find({ student: userId }).populate("course", "name").sort({ issuedAt: -1 }),
      ]);
    } else if (user.role === "teacher") {
      profile = await TeacherProfile.findOne({ user: userId }).populate("batches", "name timing");
    }

    res.json({
      success: true,
      data: { user, profile, attendance, fees, certificates },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, isActive, ...profileData } = req.body;

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (isActive !== undefined) userUpdates.isActive = isActive;

    const user = await User.findByIdAndUpdate(userId, userUpdates, { new: true }).select("-password");

    const profile = Object.keys(profileData).length
      ? await TeacherProfile.findOneAndUpdate({ user: userId }, profileData, { new: true }).populate("batches", "name")
      : await TeacherProfile.findOne({ user: userId }).populate("batches", "name");

    res.json({ success: true, data: { user, profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const archiveTeacher = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, {
      isArchived: true,
      isActive: false,
      archivedAt: new Date(),
    });
    res.json({
      success: true,
      message: "Teacher archived to database. All records preserved permanently.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeachers = async (req, res) => {
  try {
    const { page, limit, skip, isPaginated } = parsePagination(req.query);
    const filter = { role: "teacher", isArchived: { $ne: true } };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const teachersQuery = User.find(filter).select("-password").sort({ createdAt: -1 });
    const [teachers, total] = isPaginated
      ? await Promise.all([teachersQuery.skip(skip).limit(limit), User.countDocuments(filter)])
      : [await teachersQuery, null];

    const userIds = teachers.map((t) => t._id);
    const profiles = await TeacherProfile.find({ user: { $in: userIds } })
      .populate("user", "name email phone avatar isActive isArchived recoverablePassword")
      .populate("batches", "name timing");

    const data = { teachers, profiles };
    if (isPaginated) data.pagination = paginationMeta(total, page, limit);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, batches, subjects, ...profileData } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role: "teacher",
      phone,
    });

    const batchIds = Array.isArray(batches) ? batches : batches ? [batches] : [];
    const subjectList = Array.isArray(subjects)
      ? subjects
      : typeof subjects === "string"
        ? subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const profile = await TeacherProfile.create({
      user: user._id,
      ...profileData,
      batches: batchIds,
      subjects: subjectList,
    });

    if (batchIds.length) {
      await Batch.updateMany({ _id: { $in: batchIds } }, { teacher: user._id });
    }

    await profile.populate("batches", "name timing");

    res.status(201).json({
      success: true,
      data: { user: { id: user._id, name, email, phone, role: "teacher" }, profile },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createParent = async (req, res) => {
  try {
    const { name, email, password, phone, studentId, relationship = "guardian" } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required to link parent" });
    }

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "parent",
      phone,
    });

    const link = await ParentLink.create({
      parent: user._id,
      student: studentId,
      relationship,
    });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name, email, phone, role: "parent" },
        link,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const linkParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId, relationship = "guardian" } = req.body;

    const [parent, student] = await Promise.all([
      User.findOne({ _id: parentId, role: "parent" }),
      User.findOne({ _id: studentId, role: "student" }),
    ]);

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const link = await ParentLink.findOneAndUpdate(
      { parent: parentId, student: studentId },
      { parent: parentId, student: studentId, relationship },
      { upsert: true, new: true }
    ).populate("parent student", "name email");

    res.json({ success: true, data: link });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getParents = async (req, res) => {
  try {
    const parents = await User.find({ role: "parent", isActive: true }).select("-password");
    const links = await ParentLink.find({ parent: { $in: parents.map((p) => p._id) } })
      .populate("student", "name email");

    const data = parents.map((parent) => ({
      parent,
      children: links.filter((l) => l.parent.toString() === parent._id.toString()),
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
  getStudents,
  createStudent,
  updateStudent,
  archiveStudent,
  getDatabase,
  deleteArchivedRecord,
  getPersonRecord,
  getTeachers,
  createTeacher,
  updateTeacher,
  archiveTeacher,
  createParent,
  linkParentToStudent,
  getParents,
};