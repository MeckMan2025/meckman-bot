import { SFW_SYSTEM_PROMPT, SFW_CODE_SYSTEM_PROMPT, SFW_IMAGE_PREFIX } from "../ui/constitution";

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

export async function generateCode(ai: Ai, prompt: string): Promise<string> {
  const result = await ai.run("@hf/thebloke/deepseek-coder-6.7b-instruct-awq", {
    messages: [
      { role: "system", content: SFW_CODE_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    max_tokens: 2048,
  });

  if (result instanceof ReadableStream) {
    return "Streaming not supported.";
  }
  return result.response ?? "I wasn't able to generate code. Please try again.";
}

export async function generateImage(ai: Ai, prompt: string): Promise<Uint8Array> {
  const safePrompt = `${SFW_IMAGE_PREFIX}, ${prompt}`;

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

export async function generateImageFrames(
  ai: Ai,
  prompt: string,
  frameCount: number = 4
): Promise<Uint8Array[]> {
  const safePrompt = `${SFW_IMAGE_PREFIX}, ${prompt}`;
  const frames: Uint8Array[] = [];

  // Use SDXL Lightning for faster frame generation (returns ReadableStream)
  for (let i = 0; i < frameCount; i++) {
    const framePrompt = `${safePrompt}, frame ${i + 1} of ${frameCount}, slight variation`;
    const result = await ai.run("@cf/bytedance/stable-diffusion-xl-lightning", {
      prompt: framePrompt,
    });

    // SDXL Lightning returns ReadableStream<Uint8Array>
    const stream = result as unknown as ReadableStream<Uint8Array>;
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    frames.push(combined);
  }

  return frames;
}
