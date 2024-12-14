import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const WebhookSchema = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubSecret: text("github_secret").notNull(),
  discordWebhookUrl: text("discord_webhook_url"),
  slackWebhookUrl: text("slack_webhook_url"),
  telegramSecret: text("telegram_secret"),
  telegramChatId: text("telegram_chat_id"),
});
