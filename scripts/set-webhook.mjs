// Registers the Telegram webhook for this bot.
//
// Usage:
//   LOVABLE_API_KEY=... TELEGRAM_API_KEY=... node scripts/set-webhook.mjs \
//     https://YOUR-DOMAIN/api/public/telegram/webhook
//
// The secret token sent to Telegram is derived from TELEGRAM_API_KEY exactly
// the way the webhook route verifies it (sha256 base64url of
// "telegram-webhook:<TELEGRAM_API_KEY>").
import { createHash } from "node:crypto";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/set-webhook.mjs <webhook-url>");
  process.exit(1);
}
const { LOVABLE_API_KEY, TELEGRAM_API_KEY } = process.env;
if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
  console.error("Set LOVABLE_API_KEY and TELEGRAM_API_KEY in the environment first.");
  process.exit(1);
}

const secret = createHash("sha256")
  .update(`telegram-webhook:${TELEGRAM_API_KEY}`)
  .digest("base64url");

const res = await fetch("https://connector-gateway.lovable.dev/telegram/setWebhook", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": TELEGRAM_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  }),
});
const data = (await res.json()) as { ok?: boolean; description?: string; result?: unknown };
console.log(JSON.stringify(data, null, 2));
if (!data.ok) process.exit(1);
