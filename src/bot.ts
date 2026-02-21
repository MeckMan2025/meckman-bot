import { Bot, webhookCallback, InputFile } from "grammy";
import { Env } from "./types";
import { handleChat } from "./handlers/chat";
import { handleImage } from "./handlers/image";
import { HELP_TEXT, WELCOME_TEXT } from "./handlers/help";

export function createBot(env: Env): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx) => {
    await ctx.reply(WELCOME_TEXT);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.command("chat", async (ctx) => {
    const prompt = ctx.match;
    if (!prompt) {
      await ctx.reply("Usage: /chat <your message>");
      return;
    }
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const response = await handleChat(env.AI, prompt);
    await splitAndSend(ctx, response);
  });

  bot.command("image", async (ctx) => {
    const prompt = ctx.match;
    if (!prompt) {
      await ctx.reply("Usage: /image <describe the image>");
      return;
    }
    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
    const result = await handleImage(env.AI, prompt);
    if (!result.success || !result.data) {
      await ctx.reply(result.error ?? "Failed to generate image.");
      return;
    }
    await ctx.replyWithPhoto(new InputFile(result.data, "image.png"), {
      caption: prompt,
    });
  });

  // Default: treat plain text as chat
  bot.on("message:text", async (ctx) => {
    const prompt = ctx.message.text;
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const response = await handleChat(env.AI, prompt);
    await splitAndSend(ctx, response);
  });

  return bot;
}

// Telegram has a 4096 character limit per message
async function splitAndSend(ctx: { reply: (text: string) => Promise<unknown> }, text: string): Promise<void> {
  const MAX_LEN = 4096;
  if (text.length <= MAX_LEN) {
    await ctx.reply(text);
    return;
  }

  let remaining = text;
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, MAX_LEN);
    remaining = remaining.slice(MAX_LEN);
    await ctx.reply(chunk);
  }
}

export function createWebhookHandler(bot: Bot) {
  return webhookCallback(bot, "cloudflare-mod");
}
