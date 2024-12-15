# 🪿 RELEASE A GOOSE

This project provides a webhook solution that integrates with GitHub repositories to listen for `release.publish` events and notify users via their preferred communication channels, such as Discord, Telegram, or Slack. Additionally, it analyzes the structure of previous release messages and commit messages made after the last release to generate appropriate release messages based on user preferences.

---

## Features

1. **GitHub Release Notifications:**

   - Listens to `release.publish` events from GitHub repositories.
   - Sends release messages to the user's Discord, Telegram, or Slack channels.

2. **Release Message Generation:**

   - Analyzes the structure of previous release messages and commit messages since the last release.
   - Suggests two options for release messages based on the previous release structure.

3. **Customizable Notifications:**
   - Users can specify their desired notification channels (Discord, Telegram, or Slack).

---

## Endpoints

### 1. **Register a Webhook**

**Endpoint:** `POST /api/register`

This endpoint registers a webhook for a GitHub repository.

#### Request Body:

| Field               | Type   | Required | Description                                   |
| ------------------- | ------ | -------- | --------------------------------------------- |
| `githubSecret`      | string | Yes      | The secret used to authenticate GitHub events |
| `discordWebhookUrl` | string | No       | Webhook URL for Discord notifications         |
| `telegramSecret`    | string | No       | Secret for the Telegram bot                   |
| `telegramChatId`    | string | No       | Chat ID for the Telegram bot                  |
| `slackWebhookUrl`   | string | No       | Webhook URL for Slack notifications           |

#### Response:

- Returns a webhook URL that users can add to their GitHub repository.

---

### 2. **Generate Release Messages**

**Endpoint:** `POST /api/release`

This endpoint generates suggested release messages by analyzing commits since the last release.

#### Request Body:

| Field   | Type   | Required | Description                                                                                |
| ------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `url`   | string | Yes      | The repository URL for generating the release message                                      |
| `token` | string | No       | Personal access token (required if the repository is private or when api limit is reached) |

#### Response:

```json
{
  "data": {
    "release": {
      "choice1": "Summarized Release Notes",
      "choice2": "Detailed Release Notes"
    }
  }
}
```

---

### 3. **GitHub Webhook Listener**

**Endpoint:** `POST /api/webhook/:id`

This endpoint listens for `release.publish` events from GitHub and sends release notifications to the user’s configured channels.

#### Authentication:

- This endpoint is authenticated using the `githubSecret` provided during registration.
- It can only be triggered by GitHub when the secret matches the user’s when they registered.

---

## How to Use

1. **Register a Webhook:**

   - Use the `POST /api/register` endpoint to register your GitHub webhook and configure your notification preferences.
   - Add the returned webhook URL to your GitHub repository under **Settings > Webhooks**.

2. **Generate Release Messages:**

   - Use the `POST /api/release` endpoint to analyze your repository and generate release messages.

3. **Receive Notifications:**
   - Once a release is published, GitHub will trigger the webhook (`POST /api/webhook/:id`).
   - The release message will be sent to the configured Discord, Telegram, or Slack channels.

---

## Requirements

- GitHub repository with webhook permissions.
- Discord webhook URL, Telegram bot secret/chat ID, or Slack webhook URL (optional but recommended).

---

## Example

### Register a Webhook

#### Request:

```json
{
  "githubSecret": "your_github_secret",
  "discordWebhookUrl": "https://discord.com/api/webhooks/...",
  "telegramSecret": "your_telegram_bot_secret",
  "telegramChatId": "your_telegram_chat_id",
  "slackWebhookUrl": "https://hooks.slack.com/services/..."
}
```

#### Response:

```json
{
  "success": true,
  "message": "register successful",
  "data": {
    "webhookUrl": "https://your-app.com/api/webhook/:id"
  }
}
```

### Generate Release Messages

#### Request:

```json
{
  "url": "https://github.com/fiberplane/fiberplane",
  "token": "your_personal_access_token"
}
```

#### Response:

```json
{
  "success": true,
  "message": "release message generated successfully",
  "data": {
    "release": {
      "choice1": "Summarized Release Notes",
      "choice2": "Detailed Release Notes"
    }
  }
}
```

### Getting started

Make sure you have Neon set up and the api is configured to use your database.

To do this, create a `.dev.vars` file with your Neon connection string as the `DATABASE_URL` ,open api key `OPENAI_API_KEY` and Github Personal access tokens (classic) `TOKEN` as key and value (see: `.dev.vars.example`).

When you iterate on the database schema, you'll need to generate a new migration and apply it:

```sh
npm run db:generate
npm run db:migrate
```

To kick off the app locally.

```sh
npm run dev
```
