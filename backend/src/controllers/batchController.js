const Batch = require("../models/Batch");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const getBatches = async (req, res) => {
  try {
    const { page, limit, skip, isPaginated } = parsePagination(req.query);
    const query = Batch.find()
      .populate("course", "name category")
      .populate("teacher", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });

    if (isPaginated) {
      const [batches, total] = await Promise.all([
        query.skip(skip).limit(limit),
        Batch.countDocuments(),
      ]);
      return res.json({
        success: true,
        data: { batches, pagination: paginationMeta(total, page, limit) },
      });
    }

    const batches = await query;
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const batch = await Batch.create(req.body);
    const populated = await Batch.findById(batch._id)
      .populate("course teacher students", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("course teacher students", "name email");
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const StudentProfile = require("../models/StudentProfile");
    const TeacherProfile = require("../models/TeacherProfile");

    await StudentProfile.updateMany({ batch: batch._id }, { $unset: { batch: "" } });
    await TeacherProfile.updateMany({ batches: batch._id }, { $pull: { batches: batch._id } });
    await Batch.findByIdAndDelete(batch._id);

    res.json({ success: true, message: "Batch deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBatches, createBatch, updateBatch, deleteBatch };