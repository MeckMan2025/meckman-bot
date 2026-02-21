import { Env } from "./types";
import { createBot, createWebhookHandler } from "./bot";
import { handleApiRequest } from "./api/routes";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Telegram webhook
    if (path === "/api/telegram") {
      // Verify webhook secret
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      const bot = createBot(env);
      const handler = createWebhookHandler(bot);
      return handler(request);
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
