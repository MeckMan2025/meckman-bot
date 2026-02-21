import { filterImageInput } from "../services/content-filter";
import { checkBudget, recordUsage, NEURON_COSTS } from "../services/usage";
import { generateImageFrames } from "../services/ai";
import { framesToBase64 } from "../services/gif-encoder";

const FRAME_COUNT = 4;

export async function handleGif(
  ai: Ai,
  prompt: string
): Promise<{ success: boolean; frames?: string[]; error?: string }> {
  // Layer 1: Input filter (stricter for images)
  const filterResult = filterImageInput(prompt);
  if (!filterResult.safe) {
    return { success: false, error: filterResult.message };
  }

  // Layer 2: Budget check (GIF costs multiple image generations)
  const budget = checkBudget(NEURON_COSTS.gif);
  if (!budget.allowed) {
    return { success: false, error: budget.message };
  }

  try {
    const frames = await generateImageFrames(ai, prompt, FRAME_COUNT);
    recordUsage(NEURON_COSTS.gif);

    // Return base64-encoded frames for client-side animation
    const base64Frames = framesToBase64(frames);
    return { success: true, frames: base64Frames };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("exceeded") || msg.includes("quota") || msg.includes("limit")) {
      return { success: false, error: "This account has exceeded free tier usage. Please check back later." };
    }
    return { success: false, error: "Something went wrong generating the GIF. Please try again." };
  }
}
