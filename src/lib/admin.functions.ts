import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


import { useSession } from "@tanstack/react-start/server";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "admin-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

async function sha(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Admin is intentionally open (owner asked for no password).
async function requireUnlocked() {}

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => z.object({ password: z.string().max(200) }).parse(input))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("ADMIN_PASSWORD is not set");
    const [a, b] = await Promise.all([sha(data.password), sha(expected)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    if (diff !== 0) return { ok: false as const };
    const session = await useSession<GateSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getAdminOverview = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [keys, users, requests] = await Promise.all([
      supabaseAdmin
        .from("license_keys")
        .select("id, key, status, issued_to_trader_id, issued_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("verified_users")
        .select("id, chat_id, username, trader_id, verified_at")
        .order("verified_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("verification_requests")
        .select("id, chat_id, trader_id, status, affiliate_reply, created_at, resolved_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    return {
      keys: keys.data ?? [],
      verifiedUsers: users.data ?? [],
      requests: requests.data ?? [],
      stats: {
        availableKeys: (keys.data ?? []).filter((k) => k.status === "available").length,
        issuedKeys: (keys.data ?? []).filter((k) => k.status === "issued").length,
        verifiedUsers: (users.data ?? []).length,
        pendingRequests: (requests.data ?? []).filter((r) => r.status === "pending").length,
      },
    };
  });

export const getBridgeStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("bridge_state" as never)
      .select("status, last_seen")
      .eq("id", 1)
      .maybeSingle();
    return (data as { status: string; last_seen: string | null } | null) ?? { status: "offline", last_seen: null };
  });

export const submitLoginCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: z.string().regex(/^\d{4,8}$/) }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("bridge_state" as never).update({ login_code: data.code } as never).eq("id", 1);
    return { ok: true };
  });

export const resetBridgeLogin = createServerFn({ method: "POST" })
  .handler(async () => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("bridge_state" as never)
      .update({ session_string: null, login_code: null, status: "restart_needed" } as never)
      .eq("id", 1);
    return { ok: true };
  });

export const addLicenseKeys = createServerFn({ method: "POST" })
  .inputValidator((input: { keys: string }) => z.object({ keys: z.string().min(1).max(20000) }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const keys = [...new Set(data.keys.split(/\r?\n/).map((k) => k.trim()).filter(Boolean))];
    if (keys.length === 0) throw new Error("No keys provided");
    if (keys.length > 500) throw new Error("Maximum 500 keys at once");

    const { error } = await supabaseAdmin
      .from("license_keys")
      .upsert(keys.map((key) => ({ key })), { onConflict: "key", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { added: keys.length };
  });

// Manual verification (used when the helper is offline).
export const deleteLicenseKey = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => z.object({ id: z.number().int().positive().safe() }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: deleted, error } = await supabaseAdmin
      .from("license_keys")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deleted) throw new Error("License key not found; refresh the list.");
    return { ok: true };
  });

export const deleteAllLicenseKeys = createServerFn({ method: "POST" })
  .inputValidator((input: { confirmation: string }) => z.object({ confirmation: z.literal("DELETE ALL KEYS") }).parse(input))
  .handler(async () => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("license_keys").delete().gt("id", 0);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// The admin must enter the balance they confirmed — it is never guessed.
export const resolveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: { requestId: string; verified: boolean; balance?: number }) =>
    z
      .object({ requestId: z.string().uuid(), verified: z.boolean(), balance: z.number().min(0).max(10_000_000).optional() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    const E = await import("@/lib/bot.server");
    const outcome = data.verified
      ? { kind: "verified" as const, balance: data.balance ?? 0, deposit: data.balance ?? 0 }
      : { kind: "not_found" as const };
    return E.applyVerdict(data.requestId, outcome, `[MANUAL] balance=${data.balance ?? "-"}`);
  });

export const getBotConfig = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [s, svc, users] = await Promise.all([
    supabaseAdmin.from("bot_settings").select("key, value"),
    supabaseAdmin.from("service_config").select("*").order("sort"),
    supabaseAdmin.from("bot_users").select("*").order("updated_at", { ascending: false }).limit(200),
  ]);
  return { settings: s.data ?? [], services: svc.data ?? [], botUsers: users.data ?? [] };
});

export const saveBotConfig = createServerFn({ method: "POST" })
  .inputValidator((input: {
    settings: { key: string; value: string }[];
    services: { service_key: string; title: string; min_balance: number; invite_link: string | null }[];
  }) =>
    z
      .object({
        settings: z.array(z.object({ key: z.string().max(60), value: z.string().max(4000) })).max(30),
        services: z
          .array(
            z.object({
              service_key: z.string().max(40),
              title: z.string().min(1).max(80),
              min_balance: z.number().min(0).max(1_000_000),
              invite_link: z.string().max(300).nullable(),
            }),
          )
          .max(10),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.settings.length) {
      const { error } = await supabaseAdmin.from("bot_settings").upsert(data.settings, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    for (const s of data.services) {
      const { error } = await supabaseAdmin
        .from("service_config")
        .update({ title: s.title, min_balance: s.min_balance, invite_link: s.invite_link || null })
        .eq("service_key", s.service_key);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Removes a trader's verification (approved IDs only): the verified_users row
 * is deleted and the bot user resets, so they must send their trader ID again
 * and pass verification before they can use any service. */
export const unverifyUser = createServerFn({ method: "POST" })
  .inputValidator((input: { chatId: number }) => z.object({ chatId: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("verified_users").delete().eq("chat_id", data.chatId);
    const { error } = await supabaseAdmin
      .from("bot_users")
      .update({ trader_verified: false, last_balance: 0, last_deposit: 0, state: "menu", updated_at: new Date().toISOString() })
      .eq("chat_id", data.chatId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFaqs = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("bot_faqs").select("id, question, answer").order("created_at", { ascending: false });
  return data ?? [];
});

export const addFaqsBulk = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => z.object({ text: z.string().min(1).max(100000) }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { parseBulkFaqs } = await import("@/lib/bot");
    const rows = parseBulkFaqs(data.text);
    if (!rows.length) throw new Error('No questions found. Use "Q:" and "A:" lines.');
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bot_faqs").insert(rows);
    if (error) throw new Error(error.message);
    return { added: rows.length };
  });

export const updateFaq = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; question: string; answer: string }) =>
    z.object({ id: z.string().uuid(), question: z.string().min(1).max(2000), answer: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bot_faqs").update({ question: data.question, answer: data.answer }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("bot_faqs").delete().eq("id", data.id);
    return { ok: true };
  });
