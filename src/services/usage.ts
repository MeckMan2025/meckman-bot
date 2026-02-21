import { EXCEEDED_MESSAGE } from "../ui/constitution";

// In-memory usage tracker (resets when worker restarts or isolate is recycled)
// For a more durable solution, use Cloudflare KV (Phase 8 enhancement)
let dailyUsage = 0;
let currentDate = "";

const DAILY_NEURON_LIMIT = 10_000;

// Estimated neuron costs per operation
export const NEURON_COSTS = {
  chat: 500,
  image: 4000,
  imageScreen: 500,
} as const;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function resetIfNewDay(): void {
  const today = getTodayKey();
  if (today !== currentDate) {
    dailyUsage = 0;
    currentDate = today;
  }
}

export function checkBudget(estimatedCost: number): { allowed: boolean; message?: string } {
  resetIfNewDay();

  if (dailyUsage + estimatedCost > DAILY_NEURON_LIMIT) {
    return { allowed: false, message: EXCEEDED_MESSAGE };
  }

  return { allowed: true };
}

export function recordUsage(cost: number): void {
  resetIfNewDay();
  dailyUsage += cost;
}

export function getUsage(): { used: number; limit: number; remaining: number } {
  resetIfNewDay();
  return {
    used: dailyUsage,
    limit: DAILY_NEURON_LIMIT,
    remaining: Math.max(0, DAILY_NEURON_LIMIT - dailyUsage),
  };
}
