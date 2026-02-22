import { Env } from "./types";
import { createBot } from "./bot";
import { handleApiRequest } from "./api/routes";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Telegram webhook
    if (path === "/api/telegram") {
      // Verify webhook secret
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Parse and validate the update
      let update: unknown;
      try {
        update = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      // Basic schema validation: must be an object with update_id
      if (
        typeof update !== "object" ||
        update === null ||
        !("update_id" in update) ||
        typeof (update as Record<string, unknown>).update_id !== "number"
      ) {
        return new Response("Invalid update", { status: 400 });
      }

      // Process in the background so the webhook returns 200 immediately
      const bot = createBot(env);
      ctx.waitUntil(
        bot.init().then(() => bot.handleUpdate(update as Parameters<typeof bot.handleUpdate>[0])).catch((err) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          console.error("Bot update error:", msg);
        })
      );
      return new Response("OK", { status: 200 });
    }

    // Web API endpoints
    if (path.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    // Everything else: let Cloudflare Assets serve static files from /public
    // This handles /, /index.html, /styles.css, /app.js, /manifest.json, etc.
    return new Response("Not Found", { status: 404 });
  },
};
