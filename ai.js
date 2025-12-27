import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const SYSTEM_PROMPT =
  "You are Nova, a helpful Telegram bot. Be friendly, concise, and practical. Response word count cap is 5000. Use less emoji.";

export async function askGemini(userMessage) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
  });

  return response.text;
}
