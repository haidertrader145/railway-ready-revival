import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { getBotConfig, saveBotConfig } from "@/lib/admin.functions";

type Config = Awaited<ReturnType<typeof getBotConfig>>;

const FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "welcome_text", label: "Welcome message", multiline: true },
  { key: "welcome_media_url", label: "Welcome video link (public .mp4 URL)" },
  { key: "welcome_voice_url", label: "Welcome voice note link (public .ogg URL)" },
  { key: "quotex_reg_link", label: "Quotex registration link" },
  { key: "pocket_reg_link", label: "Pocket Option registration link" },
  { key: "youtube_link", label: "YouTube Premium Classes playlist link" },
  { key: "onetoone_timings", label: "One-to-One session timings", multiline: true },
  { key: "autodelete_minutes", label: "Auto-delete bot messages after (minutes, 0 = never)" },
  { key: "link_delete_minutes", label: "Delete group links after (minutes)" },
];

const input =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function BotSettingsPanel() {
  const load = useServerFn(getBotConfig);
  const save = useServerFn(saveBotConfig);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Config["services"]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load().then((c) => {
      setCfg(c);
      setValues(Object.fromEntries(c.settings.map((s) => [s.key, s.value ?? ""])));
      setServices(c.services);
    });
  }, [load]);

  if (!cfg) return <p className="mt-4 text-sm text-muted-foreground">Loading…</p>;

  async function onSave() {
    setSaving(true);
    try {
      await save({
        data: {
          settings: FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? "" })),
          services: services.map((s) => ({
            service_key: s.service_key,
            title: s.title,
            min_balance: Number(s.min_balance),
            invite_link: s.invite_link,
          })),
        },
      });
      alert("Saved");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Services &amp; minimum balance</h2>
        <div className="mt-3 space-y-3">
          {services.map((s, i) => (
            <div key={s.service_key} className="grid gap-2 md:grid-cols-[1fr_120px_1.5fr]">
              <input className={input} value={s.title} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className={input} type="number" value={s.min_balance} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, min_balance: Number(e.target.value) } : x)))} />
              <input className={input} placeholder="Group invite link (Trading Series / VIP)" value={s.invite_link ?? ""} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, invite_link: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Bot messages &amp; links</h2>
        <div className="mt-3 space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm text-muted-foreground">
              {f.label}
              {f.multiline ? (
                <textarea rows={3} className={input} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : (
                <input className={input} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
        </div>
        <button onClick={onSave} disabled={saving} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Bot user records</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Telegram ID</th>
                <th className="pb-2 pr-4 font-medium">Platform</th>
                <th className="pb-2 pr-4 font-medium">Trader ID</th>
                <th className="pb-2 pr-4 font-medium">Registered</th>
                <th className="pb-2 pr-4 font-medium">Balance</th>
                <th className="pb-2 font-medium">Service</th>
              </tr>
            </thead>
            <tbody>
              {cfg.botUsers.map((u) => (
                <tr key={u.chat_id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono">{u.chat_id}</td>
                  <td className="py-2 pr-4">{u.platform ?? "—"}</td>
                  <td className="py-2 pr-4 font-mono">{u.trader_id ?? "—"}</td>
                  <td className="py-2 pr-4">{u.trader_verified ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4">${Number(u.last_balance).toFixed(2)}</td>
                  <td className="py-2">{u.selected_service ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
