# Roadmap

- [x] Remove the current-ID lock so users can verify different IDs, while preserving permanent cross-account ownership and fresh balance checks; four webhook regression tests pass.

- [x] Recommend free learning and community support in chat, without loss-recovery promises or deposit pressure; 19 targeted tests pass

- [x] Bind successfully verified Trader IDs to one Telegram account, including concurrent checks and admin resets; tests and real webhook rejection verified
- [x] Explain Telegram group auto-approval and zero-balance removal feasibility; group automation remains unimplemented

- [x] Restore full source from trader-id-keykeeper upload (bot, admin, bridge routes, tests)
- [x] New Lovable Cloud database: core bot tables + services/settings/bridge row applied
- [x] Railway deployment files: Dockerfile (Node server preset), railway.json, .env.example, RAILWAY.md, webhook setup script
- [x] Verified the Railway build (node-server preset) builds and serves; packaged amir-fx-railway.zip for upload
- [x] Link the Telegram connection in the new workspace (@AmirQx_bot) — re-linked again after a second workspace move, verified via getMe
- [x] Collect secrets: VERIFIER_SECRET, TG_API_ID/HASH/PHONE/2FA, AFFILIATE_BOT, ADMIN_PASSWORD, SESSION_SECRET
- [x] Publish and register the Telegram webhook on the live URL
- [ ] Owner: send /start to the bot to confirm the real reply
- [ ] Owner: add license keys in the admin panel (new database starts empty)
- [x] Verification helper received (railway-bridge-v6_1.zip), repointed at the current app URL and packaged as amir-fx-verifier-railway.zip
- [ ] Optional: deploy to Railway and re-register the webhook on the Railway domain
- [x] Bot: digits-only trader IDs, stale pending checks auto-expire (10 min), Quotex signup link saved
- [x] Re-linked Telegram after another workspace move; webhook re-registered with the verifier-based secret
- [x] Publish requested so the live bot gets the digits-only, no-stuck and chat-agent changes
- [x] Bot: Pocket Option removed everywhere (menu button, ID question, chat agent, admin field, DB setting); Railway ZIP refreshed
- [x] Bot: trader IDs must be 8–9 digits (short/long told apart); users may verify different IDs, but each verified ID belongs exclusively to its original Telegram account
- [x] One-to-One: booking auto-notifies @amirtrader540, user gets the exact message to send + the "no other messages" warning
- [x] Admin: "Remove verification" button on the Verified users tab (resets the user, they must verify again)
- [x] Links: QX series link on Trading Series, YouTube channel on Free Learning; Railway ZIP refreshed
- [x] Re-linked Telegram again after the latest workspace move; bot @AmirQx_bot verified reachable
- [x] Re-linked Telegram after the latest workspace move (@AmirQx_bot verified; webhook still registered)
- [x] Registration link appended to every bot message for unverified users (say + sayPlain, skipped when already in text); Railway ZIP refreshed
- [x] Owner's full message script (welcome, verification, failed/success, per-service, free learning) added to the bot; Telegram re-linked after workspace move
- [x] Bot clears old messages on every new message; owner-forwarded welcome video/voice saved and never deleted
