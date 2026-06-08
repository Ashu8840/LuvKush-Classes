const axios = require("axios");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const groqHeaders = () => ({
  Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  "Content-Type": "application/json",
});

const askCoach = async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ success: false, message: "AI coach is not configured (GROQ_API_KEY missing)" });
    }

    const response = await axios.post(
      GROQ_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an AI coach for Luv Kush Classes, a shorthand and typing coaching institute. Help students with typing practice, shorthand dictation, exam preparation, and study plans. Be encouraging and practical.",
          },
          {
            role: "user",
            content: context
              ? `Context: ${context}\n\nQuestion: ${question}`
              : question,
          },
        ],
        max_tokens: 1024,
      },
      { headers: groqHeaders() }
    );

    const answer = response.data.choices[0]?.message?.content || "No response";

    res.json({ success: true, data: { answer } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message,
    });
  }
};

const EXAM_PROMPTS = {
  mcq: `You create MCQ exam questions for Luv Kush Classes (shorthand, typing, computer/CCC coaching in India).
Return ONLY a valid JSON array. Each object must have:
- question (string)
- options (array of exactly 4 strings)
- correctAnswer (string, must match one option exactly)
- marks (number, default 1)
Topics: stenography rules, typing speed, punctuation, grammar, office procedures, computer basics.`,

  typing: `You create typing test passages for Luv Kush Classes typing exams.
Return ONLY a valid JSON array. Each object must have:
- question (string: the passage students must type, 40-90 words, clear English)
- correctAnswer (string: exact same text as question)
- marks (number, 5-10 based on length)
No options field. Focus on dictation-style office/letter passages.`,

  shorthand: `You create shorthand dictation passages for Luv Kush Classes stenography exams.
Return ONLY a valid JSON array. Each object must have:
- question (string: spoken-style passage 60-120 words for dictation)
- correctAnswer (string: exact transcript students should type)
- marks (number, 8-15)
No options field. Use formal Indian English suitable for court/reporting practice.`,
};

const generateQuestions = async (req, res) => {
  try {
    const {
      topic,
      count = 5,
      questionType = "mcq",
      difficulty = "intermediate",
      courseName,
    } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ success: false, message: "Topic is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Groq AI is not configured. Add GROQ_API_KEY to enable question generation.",
      });
    }

    const type = ["mcq", "typing", "shorthand"].includes(questionType) ? questionType : "mcq";
    const num = Math.min(15, Math.max(1, Number(count) || 5));

    const response = await axios.post(
      GROQ_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: EXAM_PROMPTS[type] },
          {
            role: "user",
            content: `Generate ${num} ${type} questions.
Topic: ${topic.trim()}
Difficulty: ${difficulty}
${courseName ? `Course context: ${courseName}` : ""}
Return JSON array only, no markdown.`,
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      },
      { headers: groqHeaders() }
    );

    const content = response.data.choices[0]?.message?.content || "[]";
    let questions = [];

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      questions = [];
    }

    questions = questions
      .filter((q) => q && q.question && q.correctAnswer)
      .map((q) => {
        const base = {
          question: String(q.question).trim(),
          correctAnswer: String(q.correctAnswer).trim(),
          marks: Number(q.marks) || (type === "mcq" ? 1 : type === "typing" ? 5 : 10),
        };
        if (type === "mcq") {
          const opts = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
          while (opts.length < 4) opts.push("");
          base.options = opts;
        }
        return base;
      });

    if (!questions.length) {
      return res.status(422).json({
        success: false,
        message: "AI could not generate valid questions. Try a different topic.",
      });
    }

    res.json({ success: true, data: { questions, questionType: type } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message,
    });
  }
};

module.exports = { askCoach, generateQuestions };