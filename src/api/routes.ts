import { Env } from "../types";
import { handleChat } from "../handlers/chat";
import { handleImage } from "../handlers/image";

const ALLOWED_ORIGIN = "https://bot.meckman.org";
const MAX_PROMPT_LENGTH = 2000;
const MAX_BODY_BYTES = 10_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS },
  });
}

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Reject oversized request bodies
  const contentLength = parseInt(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Request too large" }, 413);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return jsonResponse({ error: "Missing prompt" }, 400);
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return jsonResponse({ error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)` }, 400);
  }

  switch (path) {
    case "/api/chat": {
      const response = await handleChat(env.AI, prompt);
      return jsonResponse({ response });
    }

    case "/api/image": {
      const result = await handleImage(env.AI, prompt);
      if (!result.success) {
        return jsonResponse({ error: result.error }, 400);
      }
      // Return image as binary
      return new Response(result.data, {
        headers: {
          "Content-Type": "image/png",
          ...CORS_HEADERS,
          ...SECURITY_HEADERS,
        },
      });
    }

    default:
      return jsonResponse({ error: "Not found" }, 404);
  }
}
