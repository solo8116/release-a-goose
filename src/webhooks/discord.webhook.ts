export const discordWebhook = async (
  discordWebhookUrl: string | null,
  content: string | null
) => {
  if (!discordWebhookUrl || !content) {
    return;
  }
  await fetch(discordWebhookUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });
};
