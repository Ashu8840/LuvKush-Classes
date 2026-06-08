const axios = require("axios");

const countWords = (text = "") => text.trim().split(/\s+/).filter(Boolean).length;

const aggregateErrorKeys = (sessions) => {
  const keyMap = {};
  for (const session of sessions) {
    for (const err of session.errorKeys || []) {
      if (!err.key) continue;
      keyMap[err.key] = (keyMap[err.key] || 0) + (err.count || 1);
    }
  }
  return Object.entries(keyMap)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};

const buildAnalysisContext = (sessions, profileStats = {}) => {
  const topSessions = sessions.map((s, i) => ({
    rank: i + 1,
    wpm: s.wpm,
    accuracy: s.accuracy,
    language: s.language || "english",
    durationSeconds: s.durationSeconds || 0,
    passage: s.passage?.title || "Practice text",
    practicedAt: s.practicedAt,
  }));

  const avgWpm =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
      : 0;
  const avgAccuracy =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length)
      : 0;

  const errorKeys = aggregateErrorKeys(sessions);

  return {
    topSessions,
    avgWpm,
    avgAccuracy,
    errorKeys,
    profileStats,
    wpmTrend: sessions.map((s) => s.wpm).reverse(),
    accuracyTrend: sessions.map((s) => s.accuracy).reverse(),
  };
};

const getTypingInsights = async (sessions, profileStats = {}) => {
  const context = buildAnalysisContext(sessions, profileStats);

  if (!process.env.GROQ_API_KEY) {
    return {
      insights: buildFallbackInsights(context),
      context,
      source: "local",
    };
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert typing coach for Luv Kush Classes. Analyze student typing practice data and return helpful, structured feedback in markdown format with these sections:
## Difficult Keys & Fingers
## Speed & Accuracy Trends
## Consistency Analysis
## Top 5 Session Highlights
## Personalized Practice Plan
Be specific about which keys/fingers struggle most based on error data. Give 3-5 actionable drills. Keep it encouraging and practical.`,
          },
          {
            role: "user",
            content: `Analyze this student's typing practice:

Top 5 Recent Sessions: ${JSON.stringify(context.topSessions)}
Average WPM: ${context.avgWpm}
Average Accuracy: ${context.avgAccuracy}%
WPM Trend (oldest→newest): ${JSON.stringify(context.wpmTrend)}
Accuracy Trend (oldest→newest): ${JSON.stringify(context.accuracyTrend)}
Most Mistyped Keys: ${JSON.stringify(context.errorKeys)}
Profile Stats: ${JSON.stringify(context.profileStats)}`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const insights = response.data.choices[0]?.message?.content || buildFallbackInsights(context);
    return { insights, context, source: "groq" };
  } catch (error) {
    return {
      insights: buildFallbackInsights(context),
      context,
      source: "fallback",
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

const buildFallbackInsights = (context) => {
  const topErrors = context.errorKeys.slice(0, 5).map((e) => `"${e.key}" (${e.count}x)`).join(", ");
  return `## Difficult Keys
${topErrors || "No repeated key errors recorded yet — keep practicing!"}

## Speed & Accuracy
- Average WPM: **${context.avgWpm}**
- Average Accuracy: **${context.avgAccuracy}%**

## Recommendations
1. Practice the top mistyped keys slowly with correct finger placement.
2. Do 5-minute daily drills focusing on accuracy before speed.
3. Retake your assigned passages and aim to beat your best WPM by 5%.`;
};

const GROQ_HEADERS = {
  Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  "Content-Type": "application/json",
};

const callGroq = async (messages, { maxTokens = 8000, temperature = 0.6, jsonMode = false } = {}) => {
  const body = {
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", body, {
    headers: GROQ_HEADERS,
  });

  return response.data.choices[0]?.message?.content || "";
};

const stripCodeFences = (raw = "") =>
  raw
    .trim()
    .replace(/^```(?:json|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const parseJsonPassage = (raw) => {
  const text = stripCodeFences(raw);
  if (!text) return null;

  const attempts = [
    text,
    text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1),
  ].filter((s) => s && s.includes("{"));

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      const title = parsed.title || parsed.name || parsed.heading;
      const content = parsed.content || parsed.passage || parsed.text || parsed.body;
      if (title && content) {
        return { title: String(title).trim(), content: String(content).trim() };
      }
    } catch {
      // try next strategy
    }
  }

  return null;
};

const parsePlainPassage = (raw, topic = "") => {
  const text = stripCodeFences(raw);
  if (!text) return null;

  const titleLine = text.match(/^TITLE:\s*(.+)$/im);
  const delimiterSplit = text.split(/\n-{3,}\n/);
  if (titleLine && delimiterSplit.length >= 2) {
    return {
      title: titleLine[1].trim(),
      content: delimiterSplit.slice(1).join("\n---\n").trim(),
    };
  }

  const contentBlock = text.match(/CONTENT:\s*([\s\S]+)/i);
  if (titleLine && contentBlock) {
    return { title: titleLine[1].trim(), content: contentBlock[1].trim() };
  }

  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length >= 3) {
    const first = lines[0].replace(/^title:\s*/i, "").trim();
    const body = lines.slice(1).join("\n").trim();
    if (first && body.length > 200) {
      return { title: first, content: body };
    }
  }

  if (text.length > 300) {
    return {
      title: topic ? `${topic} — Typing Passage` : "Typing Practice Passage",
      content: text,
    };
  }

  return null;
};

const buildPassageMessages = ({ language, topic, difficulty, wordMin, wordMax, langLabel, plainFormat }) => {
  const safeTopic = (topic || "daily life and learning").trim();

  if (plainFormat) {
    return [
      {
        role: "system",
        content: `You write typing practice passages for students at Luv Kush Classes.
Output MUST use this exact structure (no JSON, no markdown code blocks):

TITLE: <short descriptive title>
---
<passage paragraphs here>

Requirements:
- Language: ${langLabel}
- Difficulty: ${difficulty}
- Length: ${wordMin} to ${wordMax} words
- Topic: ${safeTopic}
- Use natural paragraphs only (no bullets, no numbered lists)
- Suitable for keyboard typing drills`,
      },
      {
        role: "user",
        content: `Write a ${difficulty} ${language} typing passage about "${safeTopic}" with ${wordMin}-${wordMax} words.`,
      },
    ];
  }

  return [
    {
      role: "system",
      content: `Return a JSON object with exactly two string fields: "title" and "content".
The content must be ${wordMin}-${wordMax} words in ${langLabel}, difficulty ${difficulty}, topic "${safeTopic}".
Use plain text in content (escape quotes and newlines properly for valid JSON).`,
    },
    {
      role: "user",
      content: `Generate the typing passage JSON now.`,
    },
  ];
};

const generatePassageWithGroq = async ({ language, topic, difficulty, targetWords = 1200 }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const langLabel = language === "hindi" ? "Hindi (Devanagari script)" : "English";
  const wordMin = Math.max(800, targetWords - 200);
  const wordMax = Math.min(2000, targetWords + 200);

  const strategies = [
    { plainFormat: true, jsonMode: false, label: "plain" },
    { plainFormat: false, jsonMode: true, label: "json" },
    { plainFormat: true, jsonMode: false, label: "plain-retry" },
  ];

  let lastError = null;

  for (const strategy of strategies) {
    try {
      const raw = await callGroq(
        buildPassageMessages({ language, topic, difficulty, wordMin, wordMax, langLabel, plainFormat: strategy.plainFormat }),
        { maxTokens: 8000, temperature: strategy.label === "plain-retry" ? 0.4 : 0.6, jsonMode: strategy.jsonMode }
      );

      const parsed =
        strategy.jsonMode ? parseJsonPassage(raw) : parsePlainPassage(raw, topic) || parseJsonPassage(raw);

      if (!parsed?.title || !parsed?.content) {
        lastError = new Error("AI response missing title or content");
        continue;
      }

      const wordCount = countWords(parsed.content);
      if (wordCount < 300) {
        lastError = new Error(`Generated passage too short (${wordCount} words). Try again.`);
        continue;
      }

      return {
        title: parsed.title,
        content: parsed.content.trim(),
        wordCount,
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.response?.data?.error?.message ||
      lastError?.message ||
      "Failed to generate passage. Please try a simpler topic."
  );
};

module.exports = {
  getTypingInsights,
  generatePassageWithGroq,
  buildAnalysisContext,
  aggregateErrorKeys,
  countWords,
};