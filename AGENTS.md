<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- All Telegram Bot API calls go through the Lovable connector gateway (`telegram.server.ts`), so `LOVABLE_API_KEY` + `TELEGRAM_API_KEY` are required at runtime on any host — never swap to direct api.telegram.org calls with a raw bot token.
- Bot data tables (bot_users, service_config, bot_settings, bot_messages, verification_requests, license_keys, verified_users, bridge_state) are service-role only: RLS enabled, no policies, no anon/authenticated grants.
- The admin panel is intentionally open (owner asked for no password gate); `unlockAdmin` still requires `ADMIN_PASSWORD` for the lock/unlock feature.
- Self-host builds (Dockerfile for Railway) must set `NITRO_PRESET=node-server` and run `node .output/server/index.mjs`; the in-Lovable build stays on the default Cloudflare target.
- Migrations are applied only through the migration tool; the migrator owns `drizzle/migrations/meta/_journal.json`.
