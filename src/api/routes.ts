import { Env } from "../types";
import { handleChat } from "../handlers/chat";
import { handleImage } from "../handlers/image";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
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
        },
      });
    }

    default:
      return jsonResponse({ error: "Not found" }, 404);
  }
}
