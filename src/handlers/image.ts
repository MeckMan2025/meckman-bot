import { filterImageInput, aiScreenImagePrompt } from "../services/content-filter";
import { checkBudget, recordUsage, NEURON_COSTS } from "../services/usage";
import { generateImage } from "../services/ai";

export async function handleImage(
  ai: Ai,
  prompt: string
): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
  // Layer 1: Regex input filter (stricter for images)
  const filterResult = filterImageInput(prompt);
  if (!filterResult.safe) {
    return { success: false, error: filterResult.message };
  }

  // Layer 2: Budget check (screening + image generation combined)
  const totalCost = NEURON_COSTS.imageScreen + NEURON_COSTS.image;
  const budget = checkBudget(totalCost);
  if (!budget.allowed) {
    return { success: false, error: budget.message };
  }

  // Layer 3: AI content screening
  const screenResult = await aiScreenImagePrompt(ai, prompt);
  recordUsage(NEURON_COSTS.imageScreen);
  if (!screenResult.safe) {
    return { success: false, error: screenResult.message };
  }

  // Layer 4: Generate image
  try {
    const imageBytes = await generateImage(ai, prompt);
    recordUsage(NEURON_COSTS.image);
    return { success: true, data: imageBytes };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("exceeded") || msg.includes("quota") || msg.includes("limit")) {
      return { success: false, error: "This account has exceeded free tier usage. Please check back later." };
    }
    return { success: false, error: "Something went wrong generating the image. Please try again." };
  }
}
