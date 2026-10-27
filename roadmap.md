# Roadmap

- [x] Restore full source from trader-id-keykeeper upload (bot, admin, bridge routes, tests)
- [x] New Lovable Cloud database: core bot tables + services/settings/bridge row applied
- [x] Railway deployment files: Dockerfile (Node server preset), railway.json, .env.example, RAILWAY.md, webhook setup script
- [ ] Link the Telegram connection (bot token) so the bot can send/receive
- [ ] Collect secrets: VERIFIER_SECRET, TG_API_ID/HASH/PHONE/2FA, AFFILIATE_BOT, ADMIN_PASSWORD
- [ ] Register the Telegram webhook on the Lovable public dev URL and confirm the live bot replies
- [ ] Optional: import old data (license keys, verified users, settings) from the previous project's export
- [ ] Optional: user deploys to Railway and re-registers the webhook on the Railway domain
