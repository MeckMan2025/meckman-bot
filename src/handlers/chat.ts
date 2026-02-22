import { filterTextInput, aiScreenPrompt } from "../services/content-filter";
import { checkBudget, recordUsage, NEURON_COSTS } from "../services/usage";
import { generateChat } from "../services/ai";

export async function handleChat(ai: Ai, prompt: string): Promise<string> {
  // Layer 1: Regex input filter
  const filterResult = filterTextInput(prompt);
  if (!filterResult.safe) {
    return filterResult.message!;
  }

  // Layer 2: Budget check (screening + chat)
  const totalCost = NEURON_COSTS.chatScreen + NEURON_COSTS.chat;
  const budget = checkBudget(totalCost);
  if (!budget.allowed) {
    return budget.message!;
  }

  // Layer 3: AI content screening
  const screenResult = await aiScreenPrompt(ai, prompt);
  recordUsage(NEURON_COSTS.chatScreen);
  if (!screenResult.safe) {
    return screenResult.message!;
  }

  try {
    const response = await generateChat(ai, prompt);
    recordUsage(NEURON_COSTS.chat);
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("exceeded") || msg.includes("quota") || msg.includes("limit")) {
      return "This account has exceeded free tier usage. Please check back later.";
    }
    return "Something went wrong. Please try again.";
  }
}
