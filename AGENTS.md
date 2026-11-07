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

- Personal-session delivery sends instructions through the normal button-bearing reply, followed by an exact plain Telegram message without markup so users can forward it unchanged.
- Admin license deletion removes selected records or all records with explicit bulk confirmation; it does not revoke externally delivered licenses or reset Trader ID verification.

- Route financial-loss/distress chat to a deterministic free-learning reply before calling AI, so deposit promotion cannot be generated for these messages.
- General chat redacts the configured private session contact from saved knowledge and outgoing answers; only eligible session delivery reveals it. Public service browsing never grants access.
- Load admin Q&A as data into the existing chat agent for ordinary paraphrases; direct matches remain deterministic and Trader-ID-only states bypass chat.
- Q&A lookup failures fall back to configured service knowledge; generation failures show an explicit notice rather than silently resetting the chat to the menu.

- All Telegram Bot API calls go through the Lovable connector gateway (`telegram.server.ts`), so `LOVABLE_API_KEY` + `TELEGRAM_API_KEY` are required at runtime on any host — never swap to direct api.telegram.org calls with a raw bot token.
- Bot data tables (bot_users, service_config, bot_settings, bot_messages, verification_requests, license_keys, verified_users, bridge_state) are service-role only: RLS enabled, no policies, no anon/authenticated grants.
- The admin panel is intentionally open (owner asked for no password gate); `unlockAdmin` still requires `ADMIN_PASSWORD` for the lock/unlock feature.
- Self-host builds (Dockerfile for Railway) must set `NITRO_PRESET=node-server` and run `node .output/server/index.mjs`; the in-Lovable build stays on the default Cloudflare target.
- Migrations are applied only through the migration tool; the migrator owns `drizzle/migrations/meta/_journal.json`.
- Verified Trader ID ownership is stored permanently in service-role-only `trader_id_owners` and enforced by a database trigger; webhook prechecks improve feedback while the trigger prevents concurrent claims and survives admin verification resets.
- When a chat submits a different Trader ID, clear its previous verification and cached balance before saving the ID; only a successful new verdict may claim ownership and grant services.
