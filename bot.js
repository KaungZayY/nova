import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

// /start command
bot.start((ctx) => {
  ctx.reply("Hello! I am nova.");
});

// /help command
bot.help((ctx) => {
  ctx.reply("Available commands:\n/start\n/help\n/weather (city name)");
});

bot.command("weather", async (ctx) => {
  const city = ctx.message.text.split(" ").slice(1).join(" ");
  if (!city) {
    return ctx.reply("Usage: /weather <city>\nExample: /weather London");
  }
  try {
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
