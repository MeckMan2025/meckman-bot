import { Bot, InputFile } from "grammy";
import { Env } from "./types";
import { handleChat } from "./handlers/chat";
import { handleImage } from "./handlers/image";
import { HELP_TEXT, WELCOME_TEXT } from "./handlers/help";

const MAX_PROMPT_LENGTH = 2000;
const RATE_LIMIT_MS = 5_000; // 1 message per 5 seconds per user
const userCooldowns = new Map<number, number>();

function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const lastRequest = userCooldowns.get(userId) ?? 0;
  if (now - lastRequest < RATE_LIMIT_MS) {
    return true;
  }
  userCooldowns.set(userId, now);
  return false;
}

export function createBot(env: Env): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx) => {
    await ctx.reply(WELCOME_TEXT);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.command("chat", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId && isRateLimited(userId)) {
      await ctx.reply("Please wait a few seconds between messages.");
      return;
    }
    const prompt = ctx.match;
    if (!prompt) {
      await ctx.reply("Usage: /chat <your message>");
      return;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      await ctx.reply(`Message too long (max ${MAX_PROMPT_LENGTH} characters).`);
      return;
    }
    try {
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
      const response = await handleChat(env.AI, prompt);
      await splitAndSend(ctx, response);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Chat command error:", msg);
      await ctx.reply("Something went wrong. Please try again.").catch(() => {});
    }
  });

  bot.command("image", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId && isRateLimited(userId)) {
      await ctx.reply("Please wait a few seconds between messages.");
      return;
    }
    const prompt = ctx.match;
    if (!prompt) {
      await ctx.reply("Usage: /image <describe the image>");
      return;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      await ctx.reply(`Prompt too long (max ${MAX_PROMPT_LENGTH} characters).`);
      return;
    }
    try {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
      const result = await handleImage(env.AI, prompt);
      if (!result.success || !result.data) {
        await ctx.reply(result.error ?? "Failed to generate image.");
        return;
      }
      await ctx.replyWithPhoto(new InputFile(result.data, "image.png"), {
        caption: prompt,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Image command error:", msg);
      await ctx.reply("Something went wrong generating the image. Please try again.").catch(() => {});
    }
  });

  // Default: treat plain text as chat
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId && isRateLimited(userId)) {
      await ctx.reply("Please wait a few seconds between messages.");
      return;
    }
    const prompt = ctx.message.text;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      await ctx.reply(`Message too long (max ${MAX_PROMPT_LENGTH} characters).`);
      return;
    }
    try {
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
      const response = await handleChat(env.AI, prompt);
      await splitAndSend(ctx, response);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Text message error:", msg);
      await ctx.reply("Something went wrong. Please try again.").catch(() => {});
    }
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
