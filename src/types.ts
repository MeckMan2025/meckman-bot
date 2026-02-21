export interface Env {
  AI: Ai;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  BOT_NAME: string;
}

export type Mode = "chat" | "code" | "image" | "gif";

export interface ApiRequest {
  mode: Mode;
  prompt: string;
}

export interface ApiResponse {
  success: boolean;
  data?: string | ArrayBuffer;
  contentType?: string;
  error?: string;
}

export interface UsageInfo {
  used: number;
  limit: number;
  exceeded: boolean;
}
