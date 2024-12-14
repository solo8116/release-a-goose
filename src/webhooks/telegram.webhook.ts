export const telegramWebhook = async (
  chat_id: String | null,
  telegramSecret: string | null,
  text: string | null
) => {
  if (!chat_id || !telegramSecret || !text) {
    return;
  }
  await fetch(`https://api.telegram.org/bot${telegramSecret}/sendMessage`, {
    body: JSON.stringify({
      chat_id,
      text,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};
