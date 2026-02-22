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

  // SDXL Base returns raw binary image data (ReadableStream)
  const result = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
    prompt: safePrompt,
    negative_prompt: "violence, weapons, blood, nsfw, nude, gore, disturbing",
    num_steps: 20,
    guidance: 7.5,
  });

  if (result instanceof ReadableStream) {
    const reader = result.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const bytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  }

  // Fallback: if it returns a Uint8Array directly
  if ((result as unknown) instanceof Uint8Array) {
    return result as unknown as Uint8Array;
  }

  throw new Error("No image data returned");
}
