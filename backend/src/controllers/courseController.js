const Course = require("../models/Course");
const StudentProfile = require("../models/StudentProfile");
const Batch = require("../models/Batch");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const DEFAULT_CATEGORIES = ["shorthand", "typing", "computer", "ccc"];

const getCourseCategories = async (req, res) => {
  try {
    const distinct = await Course.distinct("category");
    const categories = [...new Set([...DEFAULT_CATEGORIES, ...distinct.filter(Boolean)])].sort();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const { page, limit, skip, isPaginated } = parsePagination(req.query);
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { category: { $regex: req.query.search, $options: "i" } },
      ];
    }

    if (isPaginated) {
      const [courses, total] = await Promise.all([
        Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Course.countDocuments(filter),
      ]);
      return res.json({
        success: true,
        data: { courses, pagination: paginationMeta(total, page, limit) },
      });
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.category) body.category = String(body.category).trim().toLowerCase();
    const course = await Course.create(body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    await Promise.all([
      StudentProfile.updateMany({ course: course._id }, { $unset: { course: "" } }),
      Batch.updateMany({ course: course._id }, { $unset: { course: "" } }),
    ]);
    await Course.findByIdAndDelete(course._id);

    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCourses, getCourseCategories, createCourse, updateCourse, deleteCourse };