# Hosting this bot on Railway

This project deploys to Railway with the included `Dockerfile` and
`railway.json`. Railway builds a Docker image from your repository and runs
the Node server it produces.

## 1. Push the code to a Git repository

Railway deploys from a Git repo (GitHub, GitLab or Bitbucket). Connect this
project's repo there first.

## 2. Create the Railway service

1. In Railway: **New Project → Deploy from GitHub repo** and pick this repo.
2. Railway detects `railway.json` and builds with the `Dockerfile`.

## 3. Set the service variables

Add these in **Railway → your service → Variables** (see `.env.example` for
the full list with explanations):

| Variable | Where the value comes from |
| --- | --- |
| `EXTERNAL_DB_URL` | Your external database base URL, without `/rest/v1/` |
| `EXTERNAL_DB_SERVER_KEY` | Your external database secret/server key; never a publishable key |
| `SUPABASE_URL` | Your database project's URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your database project's server key |
| `SUPABASE_PUBLISHABLE_KEY` | Your database project's public key |
| `VITE_SUPABASE_URL` | Same URL as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same public key as above |
| `LOVABLE_API_KEY` | Lovable project settings (rotate it there to get the value) |
| `TELEGRAM_API_KEY` | The Telegram connection key from your Lovable project |
| `VERIFIER_SECRET` | The shared bridge secret (same value as in the helper) |
| `TG_API_ID` / `TG_API_HASH` / `TG_PHONE` / `TG_2FA_PASSWORD` | Your Telegram API credentials |
| `AFFILIATE_BOT` | Username of the Quotex affiliate bot |
| `ADMIN_PASSWORD` | Your admin panel password |
| `SESSION_SECRET` | Any long random string |

> **Bot database:** bot, admin, and verifier endpoints now use `EXTERNAL_DB_URL`
> and `EXTERNAL_DB_SERVER_KEY`, not the generated managed integration. Existing
> records have been copied to the external database. Do not rerun the initial
> setup against this populated database. Keep its server key private.
> The app stays editable in Lovable. Railway and the external database have
> their own availability/billing policies; Telegram and AI still use Lovable's
> gateway and credits. Moving data does not guarantee uninterrupted service.

## 4. Point Telegram at the Railway URL

Once the deployment is up, Railway gives you a public domain
(Service → Settings → Networking → Generate Domain). Register the webhook:

```sh
LOVABLE_API_KEY=... TELEGRAM_API_KEY=... \
  node scripts/set-webhook.mjs https://YOUR-RAILWAY-DOMAIN/api/public/telegram/webhook
```

The script sends the matching `secret_token`, so Telegram's updates are
verified by the app. Re-run it if you rotate `TELEGRAM_API_KEY`.

## 5. Verify

Open `https://YOUR-RAILWAY-DOMAIN/` — the app should load. Send `/start` to
your bot in Telegram and it should reply with the welcome menu.

## Railway service domain vs Telegram

Telegram requires an HTTPS URL — the generated Railway domain works as-is.
