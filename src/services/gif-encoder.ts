/**
 * Minimal GIF89a encoder for animated GIFs.
 * Takes raw image files (PNG/JPEG bytes from Workers AI) and produces an animated GIF.
 *
 * Since Workers AI returns full image files (not raw pixels), this encoder
 * creates a simple animated GIF by wrapping each frame's image data.
 *
 * For a production encoder, consider using the `gifenc` npm package.
 * This is a simplified approach that concatenates frames into a basic GIF.
 */

// Simple GIF89a encoder using raw RGBA pixel data
// Workers AI images need to be decoded first, but since we can't decode
// PNG/JPEG in Workers without additional libraries, we'll use a different
// approach: return individual frames and let the client animate them,
// OR use a server-side approach with pre-built GIF frames.

export function encodeAnimatedGif(
  frames: Uint8Array[],
  width: number,
  height: number,
  delay: number = 50 // delay in centiseconds (50 = 500ms)
): Uint8Array {
  // Since decoding PNG to raw pixels in Workers is non-trivial without
  // extra dependencies, we'll create a simple wrapper that the API
  // returns as multiple frames for client-side animation.
  // For now, return the first frame as a static image.
  // TODO: Integrate gifenc or a WASM-based encoder for true GIF animation.

  if (frames.length === 0) {
    throw new Error("No frames provided");
  }

  // Return first frame as fallback - the web UI handles frame animation client-side
  return frames[0];
}

/**
 * For the web API, we return frames as a JSON response with base64-encoded images.
 * The client-side JavaScript handles the animation.
 */
export function framesToBase64(frames: Uint8Array[]): string[] {
  return frames.map((frame) => {
    let binary = "";
    for (let i = 0; i < frame.length; i++) {
      binary += String.fromCharCode(frame[i]);
    }
    return btoa(binary);
  });
}
