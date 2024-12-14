export const slackWebhook = async (
  slackWebhookUrl: string | null,
  text: string | null
) => {
  if (!slackWebhookUrl || !text) {
    return;
  }
  await fetch(slackWebhookUrl, {
    body: JSON.stringify({
      text,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};
