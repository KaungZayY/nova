import { Telegraf } from "telegraf";
import { askGemini, summarizeHistory } from "./ai.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

// /start command
bot.start((ctx) => {
  ctx.reply("Hello! I am nova.");
});

// /help command
bot.help((ctx) => {
  ctx.reply(
    "*Nova Help*\n\n" +
      "/start – Start the bot and see a greeting\n" +
      "/weather <city> – Get the current weather for a city\n" +
      "/reset – Clear conversation memory and start fresh\n" +
      "/help – Show this help message\n\n" +
      "You can also chat with me normally — just send a message!",
    { parse_mode: "Markdown" }
  );
});

bot.command("weather", async (ctx) => {
  const city = ctx.message.text.split(" ").slice(1).join(" ");
  if (!city) {
    return ctx.reply("Usage: /weather <city>\nExample: /weather London");
  }
  try {
    await ctx.replyWithChatAction("typing");

    // Geocoding: city -> lat/lon, to set param api call
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=1`
    );
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return ctx.reply(`I couldn't find "${city}".`);
    }
    const place = geoData.results[0];
    const { latitude, longitude, name, country } = place;

    // Weather request
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const weatherData = await weatherRes.json();

    const weather = weatherData.current_weather;

    // Reply
    const message = `
Weather in ${name}, ${country}
Temperature: ${weather.temperature}°C
Wind speed: ${weather.windspeed} km/h
`.trim();

    ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error);
    ctx.reply("Something went wrong. Please try again.");
  }
});

const greetingReplies = [
  "Hey!",
  "Hi there",
  "Hey! How can I help?",
  "Hey! What’s up?",
  "Hello!",
];

bot.hears(/^(hi|hello|hey|yo)\b/i, (ctx) => {
  const reply =
    greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
  ctx.reply(reply);
});

// echo text messages
// bot.on('text', (ctx) => {
//   ctx.reply(`You said: ${ctx.message.text}`);
// });

// launch bot
bot.launch();

console.log("🤖 Bot is running...");

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// ===== USER MEMORY =====
const memory = new Map();

function getMemory(userId) {
  if (!memory.has(userId)) {
    memory.set(userId, {
      summary: "",
      history: [],
    });
  }
  return memory.get(userId);
}
const MAX_HISTORY = 10;
const SUMMARY_TRIGGER = 14;

// reset conversation
bot.command("reset", (ctx) => {
  const userId = ctx.from.id;
  const mem = getMemory(userId);

  mem.summary = "";
  mem.history = [];

  ctx.reply("Conversation memory has been reset.");
});

// Gemini AI
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  // Ignore commands
  if (text.startsWith("/")) return;

  // Only private chats
  if (ctx.chat.type !== "private") return;

  const clarifyReplies = [
    "Could you tell me a bit more?",
    "I’m listening — can you expand?",
    "What would you like to know?",
  ];

  // filter out emoji or short text
  if (text.length < 4 || /^[\p{Emoji}\s]+$/u.test(text)) {
    return ctx.reply(
      clarifyReplies[Math.floor(Math.random() * clarifyReplies.length)]
    );
  }

  const mem = getMemory(ctx.from.id);

  try {
    await ctx.replyWithChatAction("typing");

    const reply = await askGemini({
      summary: mem.summary,
      history: mem.history,
      userMessage: text,
    });

    // Telegram safety limit
    ctx.reply(reply.slice(0, 4000));

    mem.history.push(
      { role: "user", parts: [{ text }] },
      { role: "model", parts: [{ text: reply }] }
    );

    if (mem.history.length > SUMMARY_TRIGGER) {
      const summary = await summarizeHistory(mem.history);
      mem.summary = summary;
      mem.history = mem.history.slice(-MAX_HISTORY);
    }
  } catch (err) {
    console.error(err);
    ctx.reply("I'm having trouble thinking right now.");
  }
});
