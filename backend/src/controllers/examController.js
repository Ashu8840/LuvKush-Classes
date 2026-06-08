const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const Batch = require("../models/Batch");
const StudentProfile = require("../models/StudentProfile");
const { evaluateDictation } = require("../services/shorthandEvaluator");
const { awardXp } = require("../services/gamificationService");
const axios = require("axios");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const getExamWindow = (exam) => {
  const start = new Date(exam.scheduledAt);
  const end = new Date(start.getTime() + (exam.duration || 60) * 60 * 1000);
  return { start, end };
};

const getExamTimingStatus = (exam) => {
  if (exam.isTimed === false) return { status: "live", ...getExamWindow(exam) };
  const now = new Date();
  const { start, end } = getExamWindow(exam);
  if (now < start) return { status: "upcoming", start, end };
  if (now > end) return { status: "ended", start, end };
  return { status: "live", start, end };
};

const getExams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.batchId) filter.batch = req.query.batchId;
    if (req.query.type) filter.type = req.query.type;
    if (req.user.role === "student") filter.isPublished = true;

    const { page, limit, skip, isPaginated } = parsePagination(req.query);
    const examsQuery = Exam.find(filter)
      .populate("course batch createdBy", "name title")
      .sort({ scheduledAt: -1 });

    if (isPaginated) {
      const [exams, total] = await Promise.all([
        examsQuery.skip(skip).limit(limit),
        Exam.countDocuments(filter),
      ]);
      return res.json({
        success: true,
        data: { exams, pagination: paginationMeta(total, page, limit) },
      });
    }

    const exams = await examsQuery;
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("course batch createdBy", "name title");

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const data = exam.toObject();
    const timing = getExamTimingStatus(exam);
    data.timingStatus = timing.status;
    data.examWindowStart = timing.start;
    data.examWindowEnd = timing.end;

    if (req.user.role === "student") {
      data.questions = data.questions.map((q) => {
        const question = { ...q };
        delete question.correctAnswer;
        return question;
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startAttempt = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: "Exam not found or not published" });
    }

    const timing = getExamTimingStatus(exam);
    if (timing.status === "upcoming") {
      return res.status(403).json({
        success: false,
        message: "Exam has not started yet",
        startsAt: timing.start,
      });
    }
    if (timing.status === "ended") {
      return res.status(403).json({
        success: false,
        message: "Exam window has ended",
        endsAt: timing.end,
      });
    }

    const completed = await ExamAttempt.findOne({
      exam: exam._id,
      student: req.user._id,
      status: "evaluated",
    });
    if (completed) {
      return res.status(400).json({ success: false, message: "You have already submitted this exam" });
    }

    const existing = await ExamAttempt.findOne({
      exam: exam._id,
      student: req.user._id,
      status: "in_progress",
    });

    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: "Resuming existing attempt",
        examWindowEnd: timing.end,
      });
    }

    const attempt = await ExamAttempt.create({
      exam: exam._id,
      student: req.user._id,
      startedAt: new Date(),
      answers: exam.questions.map((_, i) => ({ questionIndex: i })),
      status: "in_progress",
    });

    res.status(201).json({
      success: true,
      data: attempt,
      examWindowEnd: timing.end,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("course batch createdBy", "name title");
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }
    await ExamAttempt.deleteMany({ exam: exam._id });
    res.json({ success: true, message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamEvaluation = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("course batch", "name");
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    let students = [];
    if (exam.batch) {
      const batch = await Batch.findById(exam.batch._id || exam.batch).populate("students", "name email avatar");
      students = batch?.students || [];
    } else {
      const profiles = await StudentProfile.find({}).populate("user", "name email avatar");
      students = profiles.map((p) => p.user).filter(Boolean);
    }

    const attempts = await ExamAttempt.find({ exam: exam._id }).populate("student", "name email avatar");

    const roster = students.map((student) => {
      const sid = student._id.toString();
      const attempt = attempts.find((a) => (a.student?._id || a.student)?.toString() === sid);
      const result = exam.results?.find((r) => r.student?.toString() === sid);
      let status = "absent";
      if (attempt?.status === "evaluated") status = "present";
      else if (attempt?.status === "in_progress") status = "in_progress";

      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
        },
        status,
        score: attempt?.score ?? null,
        wpm: attempt?.wpm ?? null,
        accuracy: attempt?.accuracy ?? null,
        submittedAt: attempt?.submittedAt ?? null,
        rank: result?.rank ?? null,
        attemptId: attempt?._id ?? null,
      };
    });

    const present = roster.filter((r) => r.status === "present").length;
    const absent = roster.filter((r) => r.status === "absent").length;
    const inProgress = roster.filter((r) => r.status === "in_progress").length;

    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          type: exam.type,
          questionType: exam.questionType,
          totalMarks: exam.totalMarks,
          scheduledAt: exam.scheduledAt,
          duration: exam.duration,
          batch: exam.batch,
          course: exam.course,
        },
        roster,
        stats: { total: roster.length, present, absent, inProgress },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const evaluateAnswer = (question, answerData, questionType) => {
  if (questionType === "mcq" || (question.options && question.options.length)) {
    const isCorrect = answerData.answer?.trim() === question.correctAnswer?.trim();
    return {
      isCorrect,
      marks: isCorrect ? (question.marks || 1) : 0,
      answer: answerData.answer,
    };
  }

  if (questionType === "typing" || questionType === "shorthand") {
    const typedText = answerData.typedText || answerData.answer || "";
    const durationSeconds = answerData.durationSeconds || 60;
    const expected = question.correctAnswer || question.question || "";
    const evaluation = evaluateDictation(expected, typedText, durationSeconds);

    const marksRatio = evaluation.accuracy / 100;
    const marks = Math.round((question.marks || 1) * marksRatio);

    return {
      isCorrect: evaluation.accuracy >= 80,
      marks,
      typedText,
      wpm: evaluation.wpm,
      accuracy: evaluation.accuracy,
      answer: typedText,
    };
  }

  return { isCorrect: false, marks: 0, answer: answerData.answer };
};

const submitAttempt = async (req, res) => {
  try {
    const { answers } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const timing = getExamTimingStatus(exam);
    if (exam.isTimed !== false && timing.status === "upcoming") {
      return res.status(403).json({ success: false, message: "Exam has not started yet" });
    }

    let attempt = await ExamAttempt.findOne({
      exam: exam._id,
      student: req.user._id,
      status: "in_progress",
    });

    if (!attempt) {
      attempt = await ExamAttempt.create({
        exam: exam._id,
        student: req.user._id,
        startedAt: new Date(Date.now() - (exam.duration || 60) * 60 * 1000),
        status: "in_progress",
      });
    }

    const submittedAt = new Date();
    const timeTakenSeconds = Math.round((submittedAt - attempt.startedAt) / 1000);

    let totalScore = 0;
    let totalWpm = 0;
    let totalAccuracy = 0;
    let wpmCount = 0;

    const evaluatedAnswers = (answers || []).map((ans) => {
      const question = exam.questions[ans.questionIndex];
      if (!question) return { questionIndex: ans.questionIndex, isCorrect: false, marks: 0 };

      const result = evaluateAnswer(question, ans, exam.questionType);
      totalScore += result.marks || 0;
      if (result.wpm) {
        totalWpm += result.wpm;
        totalAccuracy += result.accuracy || 0;
        wpmCount += 1;
      }

      return {
        questionIndex: ans.questionIndex,
        answer: result.answer,
        typedText: result.typedText,
        isCorrect: result.isCorrect,
        marks: result.marks,
        wpm: result.wpm,
        accuracy: result.accuracy,
      };
    });

    const avgWpm = wpmCount > 0 ? Math.round(totalWpm / wpmCount) : 0;
    const avgAccuracy = wpmCount > 0 ? Math.round(totalAccuracy / wpmCount) : 0;

    attempt.answers = evaluatedAnswers;
    attempt.score = totalScore;
    attempt.wpm = avgWpm;
    attempt.accuracy = avgAccuracy;
    attempt.submittedAt = submittedAt;
    attempt.timeTakenSeconds = timeTakenSeconds;
    attempt.status = "evaluated";

    if (process.env.GROQ_API_KEY) {
      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "Provide brief exam performance analysis (2-3 sentences).",
              },
              {
                role: "user",
                content: `Exam: ${exam.title}, Score: ${totalScore}/${exam.totalMarks}, WPM: ${avgWpm}, Accuracy: ${avgAccuracy}%`,
              },
            ],
            max_tokens: 200,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        attempt.analysis = response.data.choices[0]?.message?.content || "";
      } catch {
        attempt.analysis = "Review incorrect answers and practice weak areas.";
      }
    } else {
      attempt.analysis = "Review incorrect answers and practice weak areas.";
    }

    await attempt.save();

    await awardXp(req.user._id, {
      wpm: avgWpm,
      accuracy: avgAccuracy || Math.round((totalScore / (exam.totalMarks || 100)) * 100),
      type: "exam",
      durationSeconds: timeTakenSeconds,
    });

    const existingResultIndex = exam.results.findIndex(
      (r) => r.student.toString() === req.user._id.toString()
    );

    const result = {
      student: req.user._id,
      score: totalScore,
      wpm: avgWpm,
      accuracy: avgAccuracy,
      evaluatedAt: submittedAt,
    };

    if (existingResultIndex >= 0) exam.results[existingResultIndex] = result;
    else exam.results.push(result);

    exam.results.sort((a, b) => b.score - a.score);
    exam.results.forEach((r, i) => { r.rank = i + 1; });
    await exam.save();

    res.json({
      success: true,
      data: {
        attempt,
        rank: exam.results.find((r) => r.student.toString() === req.user._id.toString())?.rank,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyAttempts = async (req, res) => {
  try {
    const filter = { student: req.user._id };
    if (req.query.examId) filter.exam = req.query.examId;

    const attempts = await ExamAttempt.find(filter)
      .populate("exam", "title type totalMarks scheduledAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("results.student", "name avatar");

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const attempts = await ExamAttempt.find({ exam: exam._id, status: "evaluated" })
      .populate("student", "name avatar")
      .sort({ score: -1 });

    res.json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          type: exam.type,
          totalMarks: exam.totalMarks,
        },
        results: exam.results,
        attempts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const { score, wpm, accuracy } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const existing = exam.results.findIndex(
      (r) => r.student.toString() === req.user._id.toString()
    );

    const result = {
      student: req.user._id,
      score,
      wpm,
      accuracy,
      evaluatedAt: new Date(),
    };

    if (existing >= 0) exam.results[existing] = result;
    else exam.results.push(result);

    exam.results.sort((a, b) => b.score - a.score);
    exam.results.forEach((r, i) => { r.rank = i + 1; });

    await exam.save();
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getExamResults,
  getExamEvaluation,
  submitResult,
};