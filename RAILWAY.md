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

> **Note on the database:** the built-in Lovable backend does not expose its
> server key, so a Railway copy cannot read it. For the Railway deployment,
> point `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` /
> `SUPABASE_PUBLISHABLE_KEY` at a database project you own (for example your
> earlier Supabase project) and run this project's migration SQL there. The
> app itself stays editable in Lovable.

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
