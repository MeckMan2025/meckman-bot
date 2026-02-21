import { SFW_SYSTEM_PROMPT, SFW_IMAGE_PREFIX } from "../ui/constitution";

export async function generateChat(ai: Ai, userMessage: string): Promise<string> {
  const result = await ai.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
    messages: [
      { role: "system", content: SFW_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    max_tokens: 1024,
  });

  if (result instanceof ReadableStream) {
    return "Streaming not supported.";
  }
  return result.response ?? "I wasn't able to generate a response. Please try again.";
}

export async function generateImage(ai: Ai, prompt: string): Promise<Uint8Array> {
  const safePrompt = `${SFW_IMAGE_PREFIX}, ${prompt}, no violence, no weapons, no blood, no nsfw content`;

  // Flux returns { image: base64string }
  const result = await ai.run("@cf/black-forest-labs/flux-1-schnell", {
    prompt: safePrompt,
  });

  if (result.image) {
    // Decode base64 to Uint8Array
    const binaryStr = atob(result.image);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error("No image data returned");
}
