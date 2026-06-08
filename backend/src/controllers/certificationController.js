const CertificationProgram = require("../models/CertificationProgram");
const CertificationAttempt = require("../models/CertificationAttempt");
const Certificate = require("../models/Certificate");
const crypto = require("crypto");

const generateCertId = () => `LKC-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickQuestionIndices = (total, count) => {
  const indices = Array.from({ length: total }, (_, i) => i);
  return shuffle(indices).slice(0, Math.min(count, total));
};

const stripQuestionsForStudent = (program) => {
  const doc = program.toObject ? program.toObject() : { ...program };
  doc.questions = (doc.questions || []).map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
  }));
  return doc;
};

const getPrograms = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { isActive: true };
    const programs = await CertificationProgram.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const data = programs.map((p) => {
      const doc = p.toObject();
      if (req.user.role !== "admin") {
        delete doc.questions;
        doc.questionCount = p.questions?.length || 0;
      }
      return doc;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProgramById = async (req, res) => {
  try {
    const program = await CertificationProgram.findById(req.params.id).populate("createdBy", "name");
    if (!program || (!program.isActive && req.user.role !== "admin")) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    let extra = {};
    if (req.user.role === "student") {
      const [passedCert, latestAttempt] = await Promise.all([
        Certificate.findOne({ student: req.user._id, program: program._id }),
        CertificationAttempt.findOne({ student: req.user._id, program: program._id })
          .sort({ createdAt: -1 })
          .populate("certificate"),
      ]);
      extra = {
        hasCertificate: !!passedCert,
        certificate: passedCert,
        latestAttempt: latestAttempt
          ? {
              _id: latestAttempt._id,
              percentage: latestAttempt.percentage,
              passed: latestAttempt.passed,
              status: latestAttempt.status,
              submittedAt: latestAttempt.submittedAt,
            }
          : null,
      };
    }

    const data =
      req.user.role === "admin"
        ? program
        : { ...stripQuestionsForStudent(program), questionCount: program.questions?.length || 0, ...extra };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProgram = async (req, res) => {
  try {
    const program = await CertificationProgram.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProgram = async (req, res) => {
  try {
    const program = await CertificationProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProgram = async (req, res) => {
  try {
    await CertificationProgram.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Program deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startExam = async (req, res) => {
  try {
    const program = await CertificationProgram.findById(req.params.id);
    if (!program || !program.isActive) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    if (!program.questions?.length) {
      return res.status(400).json({ success: false, message: "No questions configured for this program" });
    }

    const existingCert = await Certificate.findOne({
      student: req.user._id,
      program: program._id,
    });
    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: "You already earned this certificate",
        certificate: existingCert,
      });
    }

    const count = Math.min(program.questionsPerExam, program.questions.length);
    const questionIndices = pickQuestionIndices(program.questions.length, count);

    const attempt = await CertificationAttempt.create({
      student: req.user._id,
      program: program._id,
      questionIndices,
      totalQuestions: count,
      status: "in_progress",
    });

    const examQuestions = questionIndices.map((idx) => {
      const q = program.questions[idx];
      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
      };
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        questions: examQuestions,
        totalQuestions: count,
        passingPercent: program.passingPercent,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitExam = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    const attempt = await CertificationAttempt.findById(attemptId);
    if (!attempt || attempt.student.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }
    if (attempt.status === "submitted") {
      return res.status(400).json({ success: false, message: "Attempt already submitted" });
    }

    const program = await CertificationProgram.findById(attempt.program);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const gradedAnswers = attempt.questionIndices.map((qIdx) => {
      const q = program.questions[qIdx];
      const submitted = answers?.find((a) => a.questionIndex === qIdx);
      const answer = submitted?.answer || "";
      const isCorrect =
        answer.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase();
      return { questionIndex: qIdx, answer, isCorrect };
    });

    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;
    const percentage = Math.round((correctCount / attempt.totalQuestions) * 100);
    const passed = percentage >= program.passingPercent;

    attempt.answers = gradedAnswers;
    attempt.correctCount = correctCount;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.status = "submitted";
    attempt.submittedAt = new Date();

    let certificate = null;
    if (passed) {
      const existing = await Certificate.findOne({
        student: req.user._id,
        program: program._id,
      });
      if (existing) {
        certificate = existing;
      } else {
        certificate = await Certificate.create({
          student: req.user._id,
          program: program._id,
          title: program.title,
          type: "completion",
          certificateId: generateCertId(),
          score: correctCount,
          percentage,
        });
      }
      attempt.certificate = certificate._id;
    }

    await attempt.save();

    const populatedCert = certificate
      ? await Certificate.findById(certificate._id).populate("program", "title")
      : null;

    res.json({
      success: true,
      data: {
        correctCount,
        totalQuestions: attempt.totalQuestions,
        percentage,
        passingPercent: program.passingPercent,
        passed,
        certificate: populatedCert,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  startExam,
  submitExam,
};