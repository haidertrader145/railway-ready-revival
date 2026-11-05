import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";

import { addFaqsBulk, deleteFaq, listFaqs, updateFaq } from "@/lib/admin.functions";

type Faq = { id: string; question: string; answer: string };

const input =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50";

const EXAMPLE = `Q: VIP kaise join karun | how to join vip
A: VIP join karne ke liye apne Quotex account mein $50 rakhein, phir Trader ID verify karein.

Q: Signals free hain?
A: Haan, free learning classes bilkul free hain.`;

export function FaqPanel() {
  const load = useServerFn(listFaqs);
  const add = useServerFn(addFaqsBulk);
  const upd = useServerFn(updateFaq);
  const del = useServerFn(deleteFaq);
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => load().then(setFaqs), [load]);
  useEffect(() => { refresh(); }, [refresh]);

  async function onAdd() {
    setBusy(true);
    try {
      const r = await add({ data: { text: bulk } });
      setBulk("");
      alert(`Added ${r.added} question(s)`);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Add questions in bulk</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Write each question on a "Q:" line and its reply on an "A:" line (the reply can be several lines). Put several ways
          of asking on one Q line separated by " | ". The bot sends your reply when a user types the question or something
          similar, with Back, Main Menu and Meri Services buttons.
        </p>
        <textarea rows={10} className={`${input} font-mono`} placeholder={EXAMPLE} value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <button onClick={onAdd} disabled={busy || !bulk.trim()} className={`${btn} mt-3 bg-primary text-primary-foreground hover:bg-primary/90`}>
          {busy ? "Adding…" : "Add questions"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Saved questions ({faqs?.length ?? 0})</h2>
        {!faqs ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : faqs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No questions yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {faqs.map((f) => (
              <FaqRow
                key={f.id}
                faq={f}
                onSave={async (q, a) => { await upd({ data: { id: f.id, question: q, answer: a } }); await refresh(); }}
                onDelete={async () => { if (confirm("Delete this question?")) { await del({ data: { id: f.id } }); await refresh(); } }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FaqRow({ faq, onSave, onDelete }: { faq: Faq; onSave: (q: string, a: string) => Promise<void>; onDelete: () => Promise<void> }) {
  const [q, setQ] = useState(faq.question);
  const [a, setA] = useState(faq.answer);
  const dirty = q !== faq.question || a !== faq.answer;
  return (
    <div className="rounded-lg border border-border p-3">
      <label className="block text-xs text-muted-foreground">Question (use | for variants)
        <input className={input} value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <label className="mt-2 block text-xs text-muted-foreground">Reply
        <textarea rows={3} className={input} value={a} onChange={(e) => setA(e.target.value)} />
      </label>
      <div className="mt-2 flex gap-2">
        <button disabled={!dirty || !q.trim() || !a.trim()} onClick={() => onSave(q, a).catch((e) => alert(e.message))} className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>Save</button>
        <button onClick={onDelete} className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90`}>Delete</button>
      </div>
    </div>
  );
}
