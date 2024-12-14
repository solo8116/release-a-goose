ALTER TABLE "webhooks" ALTER COLUMN "discord_webhook_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ALTER COLUMN "telegram_secret" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ALTER COLUMN "telegram_chat_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "slack_webhook_url" text;