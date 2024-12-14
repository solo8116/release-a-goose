import { instrument } from "@fiberplane/hono-otel";
import { Hono, MiddlewareHandler } from "hono";
import { TRegister, TRelease } from "./types";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { LIMIT, SYSTEM_PROMT } from "./constants";
import { eq } from "drizzle-orm";
import { discordWebhook, slackWebhook, telegramWebhook } from "./webhooks";
import { WebhookSchema } from "./db/schema";

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
};

const encoder = new TextEncoder();

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

const verifyMiddleware: MiddlewareHandler = async (c, next) => {
  const body = await c.req.text();
  const signatureHeader = c.req.header("x-hub-signature-256");
  if (!signatureHeader) {
    return c.text("Missing signature", 400);
  }
  const signature = signatureHeader.replace("sha256=", "");

  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const webhookData = await db
    .select()
    .from(WebhookSchema)
    .where(eq(WebhookSchema.id, c.req.param("id") as string));
  if (webhookData.length === 0) {
    return c.json({ success: false, message: "webhook not found" }, 404);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookData[0].githubSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signatureBuffer = new Uint8Array(
    Array.from(Buffer.from(signature, "hex"))
  );
  const bodyHmac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  if (Buffer.compare(Buffer.from(bodyHmac), signatureBuffer) === 0) {
    return next();
  } else {
    return c.text("Invalid signature", 401);
  }
};

app.post("/register", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);

    const {
      discordWebhookUrl,
      telegramChatId,
      telegramSecret,
      githubSecret,
      slackWebhookUrl,
    } = await c.req.json<TRegister>();

    const [user] = await db
      .insert(WebhookSchema)
      .values({
        discordWebhookUrl,
        telegramChatId,
        telegramSecret,
        githubSecret,
        slackWebhookUrl,
      })
      .returning({
        id: WebhookSchema.id,
      });
    return c.json(
      {
        success: true,
        message: "register successful",
        data: {
          webhookUrl: c.req.url.replace("register", "webhook/") + user.id,
        },
      },
      201
    );
  } catch (error) {
    console.log(error);
    return c.json({ success: false, message: "internal server error" }, 500);
  }
});

app.post("/release", async (c) => {
  try {
    const { url, token } = await c.req.json<TRelease>();
    if (!url || !url.startsWith("https://github.com")) {
      return c.json(
        { success: false, message: "github url is required in query" },
        400
      );
    }
    const headers: Record<string, string> = token
      ? {
          Authorization: `Bearer ${token}`,
          "User-Agent": "MyApp",
        }
      : {
          "User-Agent": "MyApp",
        };
    const ownerRepo = url.replace("https://github.com/", "");
    let response = await fetch(
      `https://api.github.com/repos/${ownerRepo}/releases`,
      {
        headers,
      }
    );
    let text = await response.text();
    const allReleases: any[] = JSON.parse(text);
    let limitedReleases = [];
    for (let i = 0; i < LIMIT; i++) {
      limitedReleases[i] = allReleases[i].body;
    }
    const releasesBody = limitedReleases
      .map((release, index) => `release ${index + 1}: ${release}`)
      .join("\n\n");
    const lastReleasePublishedAt = new Date(allReleases[0].published_at);
    let scrape = true;
    let newCommitsMessage = [];
    let page = 0;
    while (scrape) {
      response = await fetch(
        `https://api.github.com/repos/${ownerRepo}/commits?page=${page}`,
        {
          headers,
        }
      );
      text = await response.text();
      const allCommits: any[] = JSON.parse(text);
      const newCommits = allCommits.filter((data) => {
        const isNewCommit =
          new Date(data.commit.verification.verified_at) >
          lastReleasePublishedAt;
        if (!isNewCommit) {
          scrape = false;
        }
        return isNewCommit && !data.commit.message.startsWith("Merge");
      });
      newCommitsMessage = newCommits.map((data) => {
        return data.commit.message;
      });
      page++;
    }
    const commitMessage = newCommitsMessage
      .map((message, index) => `message ${index + 1}: ${message}`)
      .join("\n\n");

    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMT,
          },
          {
            role: "user",
            content: `releases: ${releasesBody}
            commits: ${commitMessage}
            `,
          },
        ],
        n: 2,
      }),
    });

    const gptResponse = JSON.parse(await response.text());

    const choice1 = gptResponse.choices[0].message.content;
    const choice2 = gptResponse.choices[1].message.content;

    return c.json(
      {
        success: true,
        message: "release message generated successfully",
        data: {
          release: {
            choice1,
            choice2,
          },
        },
      },
      200
    );
  } catch (error) {
    console.log(error);
    return c.json(
      { success: false, message: "error while generating the message" },
      500
    );
  }
});

app.post("/webhook/:id", verifyMiddleware, async (c) => {
  try {
    const githubBody = await c.req.json();
    if (githubBody.action !== "published") {
      return c.json(
        { success: false, message: "only publishes are allowed" },
        400
      );
    }
    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);

    const [webhookData] = await db
      .select()
      .from(WebhookSchema)
      .where(eq(WebhookSchema.id, c.req.param("id")));
    const content = githubBody.release.body;
    await Promise.all([
      await discordWebhook(webhookData.discordWebhookUrl, content),
      await telegramWebhook(
        webhookData.telegramChatId,
        webhookData.telegramSecret,
        content
      ),
      await slackWebhook(webhookData.slackWebhookUrl, content),
    ]);
    return c.json(
      { success: true, message: "messages send successfully" },
      200
    );
  } catch (error) {
    console.log(error);
    return c.json({ success: false, message: "internal server error" }, 500);
  }
});

export default instrument(app);
