import { filterTextInput } from "../services/content-filter";
import { checkBudget, recordUsage, NEURON_COSTS } from "../services/usage";
import { generateChat } from "../services/ai";

export async function handleChat(ai: Ai, prompt: string): Promise<string> {
  // Layer 1: Input filter
  const filterResult = filterTextInput(prompt);
  if (!filterResult.safe) {
    return filterResult.message!;
  }

  // Layer 2: Budget check
  const budget = checkBudget(NEURON_COSTS.chat);
  if (!budget.allowed) {
    return budget.message!;
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
