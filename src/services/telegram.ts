export async function sendPhoto(
  token: string,
  chatId: number,
  imageBytes: Uint8Array,
  caption?: string
): Promise<void> {
  const formData = new FormData();
  formData.append("chat_id", chatId.toString());
  formData.append("photo", new Blob([imageBytes], { type: "image/png" }), "image.png");
  if (caption) {
    formData.append("caption", caption);
  }

  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

export async function sendAnimation(
  token: string,
  chatId: number,
  gifBytes: Uint8Array,
  caption?: string
): Promise<void> {
  const formData = new FormData();
  formData.append("chat_id", chatId.toString());
  formData.append("animation", new Blob([gifBytes], { type: "image/gif" }), "animation.gif");
  if (caption) {
    formData.append("caption", caption);
  }

  await fetch(`https://api.telegram.org/bot${token}/sendAnimation`, {
    method: "POST",
    body: formData,
  });
}

export async function sendChatAction(
  token: string,
  chatId: number,
  action: "typing" | "upload_photo" | "upload_video"
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}
