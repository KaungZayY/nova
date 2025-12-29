import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
    You are Nova, a helpful AI assistant on Telegram, powered by Google's Gemini model.

    Be friendly, concise, and practical.
    Explain things clearly using plain text.
    Avoid Markdown formatting.
    Use simple lists and readable code blocks.
    Limit emojis.

    You may remember recent conversation context to be helpful.
    Keep replies within reasonable length (max ~4000 characters).
`;


export async function askGemini({ summary, history, userMessage }) {
  const contents = [
    {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    },

    summary
      ? {
          role: "user",
          parts: [{ text: `Conversation summary: ${summary}` }],
        }
      : null,

    ...history,

    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ].filter(Boolean);

  return generate(contents);
}

export async function summarizeHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "";
  }

  const conversationText = history
    .map((m) => `${m.role}: ${m.parts[0].text}`)
    .join("\n");

  const prompt = `Summarize the conversation below.
    Keep:
    - user goals
    - preferences
    - important facts
  Remove:
    - greetings
    - filler
    - repetition

  Conversation:
    ${conversationText}
  `;

  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  return generate(contents);
}

async function generate(contents) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
  });

  return response.text;
}
