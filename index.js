import { Telegraf } from "telegraf";
import { startHandler, helpHandler, weatherHandler, greetingHandler, chatHandler, resetHandler } from "./src/commands.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(startHandler);

bot.hears(/^(hi|hello|hey|yo)\b/i, greetingHandler);

bot.help(helpHandler);

bot.command("weather", weatherHandler);

bot.command("reset", resetHandler);

bot.on("text", chatHandler);

bot.launch();

console.log("Nova is running....");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
