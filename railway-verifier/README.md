# Amir FX auto-verification helper — saved Telegram session

This is ONLY the always-on verification helper. Keep your existing bot/app running in Lovable; no bot token or database key is needed here.

## Railway setup

1. Upload the files in this folder to a GitHub repository and deploy it as a Railway service.
2. In Railway → your helper service → Variables, set:

| Variable | Value |
| --- | --- |
| `VERIFIER_SECRET` | Your existing shared verifier secret, exactly matching the bot app |
| `TG_SESSION` | A Telethon StringSession for the Telegram account that can message your affiliate bot |
| `APP_BASE` | `https://railway-ready-revival.lovable.app` (or your actual running bot-app address) |
| `TG_API_ID` | The API ID used to create that session |
| `TG_API_HASH` | The API hash used to create that session |
| `AFFILIATE_BOT` | Your partner/affiliate bot username |

API details and affiliate bot can also be read from the app's existing settings; explicit Railway variables override them. `TG_PHONE` and `TG_2FA_PASSWORD` are not required when `TG_SESSION` is already authorized.

3. Run **one replica only**. Do not run the old helper at the same time or reuse this session in another running service.
4. Redeploy. An authorized TG_SESSION resumes without requesting a login code. The admin helper status should read Running.
5. Submit a fresh Trader ID through your actual bot and confirm the resulting verification reply.

## Get your TG_SESSION once, on your own computer

A bot token is NOT a Telegram user session. You need to authorize your own Telegram account once; this file cannot bypass Telegram login or missing-code delivery.

Install Python 3.11 or newer, open a terminal in this folder, then run:

```sh
python -m pip install -r requirements.txt
python generate_session.py
```

Enter your API ID, API hash and phone number locally. Get API details from https://my.telegram.org. Check the Telegram service chat on an already logged-in phone/desktop for the code; Telegram chooses delivery and SMS is not guaranteed. If no code arrives, check you are using the correct account/number and follow Telegram's login/cooldown guidance. Repeated redeploys cannot fix delivery.

The generator saves `tg-session.secret` locally instead of printing it. Open that file privately, paste its entire contents into Railway's `TG_SESSION` variable, then delete it. Never upload it, include it in Git, send it in chat, or use a third-party session-generator bot/site. It gives access to your Telegram account. Windows users should also ensure no other local users can read it.

If you already have a valid Telethon StringSession, use it directly and skip generation. Pyrogram session strings are not compatible.

## Restart and recovery behavior

- TG_SESSION takes priority over the app's saved session; Railway redeploys do not erase a variable.
- Network failures reconnect with backoff; Telegram flood-wait cooldowns are respected.
- Requests are checked sequentially. An unanswered check is reported as an error, not approved or endlessly retried. The app still expires stale pending checks after 10 minutes.
- HTTP failures are checked rather than silently claiming delivery succeeded.
- A revoked/invalid session does NOT trigger repeated code requests. Replace TG_SESSION with a newly authorized session.
- With TG_SESSION set, **Log out helper** in the app does not revoke that Railway variable. To stop it, stop the Railway service. To revoke access, terminate the session in Telegram Settings → Devices and remove TG_SESSION from Railway.
- Sessions are reusable, not guaranteed permanent: Telegram can revoke them, account restrictions can apply, and Railway/app/partner availability still matters.

## Without TG_SESSION (legacy fallback)

The helper reuses the app's saved session. If none exists it makes one login request and waits up to five minutes for the admin login code; it does not continuously resend codes inside that wait. For dependable redeploy reuse, configure TG_SESSION instead.

## Verification included

Automated tests cover saved-session priority, no-code authorized restart, revoked-session handling, sequential request delivery and timeout resolution. These tests use fakes: real Telegram authorization, code delivery and your Railway deployment must be confirmed by you after adding the session.
