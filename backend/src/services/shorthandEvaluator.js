const axios = require("axios");

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const tokenize = (text) => normalizeText(text).split(" ").filter(Boolean);

const computeWpm = (wordCount, durationSeconds) => {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  const minutes = durationSeconds / 60;
  return Math.round(wordCount / minutes);
};

const evaluateDictation = (transcript, typedText, durationSeconds) => {
  const expectedWords = tokenize(transcript);
  const typedWords = tokenize(typedText);
  const mistakes = [];

  const maxLen = Math.max(expectedWords.length, typedWords.length);
  let correctCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const expected = expectedWords[i];
    const typed = typedWords[i];

    if (!expected && typed) {
      mistakes.push({ word: typed, expected: "", typed, index: i });
    } else if (expected && !typed) {
      mistakes.push({ word: expected, expected, typed: "", index: i });
    } else if (expected && typed && expected !== typed) {
      mistakes.push({ word: expected, expected, typed, index: i });
    } else if (expected && typed) {
      correctCount += 1;
    }
  }

  const totalExpected = expectedWords.length || 1;
  const accuracy = Math.round((correctCount / totalExpected) * 100);
  const wpm = computeWpm(typedWords.length, durationSeconds);

  return {
    accuracy: Math.min(accuracy, 100),
    wpm,
    mistakes,
    correctWords: correctCount,
    totalWords: totalExpected,
    typedWordCount: typedWords.length,
  };
};

const getGroqInsights = async (transcript, typedText, mistakes, wpm, accuracy) => {
  if (!process.env.GROQ_API_KEY) {
    return "Keep practicing daily. Focus on words you missed and maintain steady speed.";
  }

  try {
    const mistakeSummary = mistakes
      .slice(0, 10)
      .map((m) => `"${m.expected}" → "${m.typed}"`)
      .join(", ");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a shorthand coach. Give brief, actionable feedback (3-4 sentences) on dictation performance.",
          },
          {
            role: "user",
            content: `WPM: ${wpm}, Accuracy: ${accuracy}%. Mistakes: ${mistakeSummary || "none"}. Transcript length: ${transcript.split(" ").length} words. Provide improvement tips.`,
          },
        ],
        max_tokens: 256,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0]?.message?.content || "";
  } catch {
    return "Practice the missed words slowly, then retry at target speed. Consistency beats speed bursts.";
  }
};

const evaluateWithInsights = async (transcript, typedText, durationSeconds) => {
  const result = evaluateDictation(transcript, typedText, durationSeconds);
  const insights = await getGroqInsights(
    transcript,
    typedText,
    result.mistakes,
    result.wpm,
    result.accuracy
  );

  return { ...result, insights };
};

module.exports = {
  normalizeText,
  tokenize,
  computeWpm,
  evaluateDictation,
  getGroqInsights,
  evaluateWithInsights,
};