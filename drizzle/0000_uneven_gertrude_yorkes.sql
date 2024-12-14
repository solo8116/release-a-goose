CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_secret" text NOT NULL,
	"discordSecret" text NOT NULL,
	"telegram_secret" text NOT NULL,
	"telegram_chat_id" text NOT NULL
);
