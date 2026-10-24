import { Telegraf } from "telegraf";
import { createServer } from "node:http";

import {
  startHandler,
  helpHandler,
  weatherHandler,
  greetingHandler,
  chatHandler,
  resetHandler,
} from "./src/commands.js";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN environment variable is missing");
}

const bot = new Telegraf(token);

// HTTP server for Render
const server = createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Nova is running");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Nova Telegram Bot");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// Telegram handlers
bot.start(startHandler);

bot.hears(/^(hi|hello|hey|yo)\b/i, greetingHandler);

bot.help(helpHandler);

bot.command("weather", weatherHandler);

bot.command("reset", resetHandler);

bot.on("text", chatHandler);

// Start Telegram long polling
bot
  .launch()
  .then(() => console.log("Nova is running on Telegram!"))
  .catch((err) => {
    console.error("Telegram bot failed to start:", err);
    process.exit(1);
  });

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  server.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  server.close();
});
