# Roadmap

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
