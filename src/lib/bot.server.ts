// Server-only bot engine: settings, menus and verification outcomes. Shared by
// the webhook, bridge callback and admin. Messages are never auto-deleted.
import { parseAffiliateReply } from "@/lib/affiliate-reply";
import * as B from "@/lib/bot";
import { telegramCall } from "@/lib/telegram.server";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadSettings(): Promise<B.BotSettings> {
  const sb = await db();
  const { data } = await sb.from("bot_settings").select("key, value");
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
  return {
    ...B.DEFAULT_SETTINGS,
    ...Object.fromEntries(Object.entries(map).filter(([, v]) => v !== "")),
  } as B.BotSettings;
}

export async function loadServices(): Promise<B.ServiceInfo[]> {
  const sb = await db();
  const { data } = await sb.from("service_config").select("*").order("sort");
  return (data ?? []).map((s) => ({ ...s, min_balance: Number(s.min_balance) }));
}

export async function loadFaqs(): Promise<B.Faq[]> {
  const sb = await db();
  const { data, error } = await sb.from("bot_faqs").select("question, answer").order("created_at").limit(1000);
  if (error) throw error;
  return data ?? [];
}

/** Q&A outages must not prevent answers from configured service knowledge. */
export async function loadChatFaqs(): Promise<B.Faq[]> {
  try {
    return await loadFaqs();
  } catch (error) {
    console.error("Chat Q&A unavailable:", error);
    return [];
  }
}

/** Sends a message. Every message gets the clickable "Register Now" button.
 * Messages are kept forever — nothing is ever auto-deleted. */
export async function say(chatId: number, text: string, keyboard?: B.InlineKeyboard) {
  const settings = await loadSettings();
  const rows: B.InlineButton[][] = [];
  if (keyboard) rows.push(...keyboard.inline_keyboard);
  const reg = B.regButtonRow(settings.quotex_reg_link);
  if (reg.length) rows.push(reg);
  const kb: B.InlineKeyboard | undefined = rows.length ? { inline_keyboard: rows } : undefined;
  const res = await telegramCall<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(kb ? { reply_markup: kb } : {}),
  });
  return res;
}

/** Expires pending verifications older than PENDING_TTL_MINUTES so a request
 * that never got an answer can never block the user or loop the checker. */
export async function expireStalePending(): Promise<void> {
  const sb = await db();
  const cutoff = new Date(Date.now() - B.PENDING_TTL_MINUTES * 60_000).toISOString();
  await sb
    .from("verification_requests")
    .update({ status: "expired", resolved_at: new Date().toISOString() })
    .eq("status", "pending")
    .lt("created_at", cutoff);
}

export async function getUser(chatId: number) {
  const sb = await db();
  const { data } = await sb.from("bot_users").select("*").eq("chat_id", chatId).maybeSingle();
  return data;
}

export async function setUser(chatId: number, patch: Record<string, unknown>) {
  const sb = await db();
  const { error } = await sb
    .from("bot_users")
    .upsert({ chat_id: chatId, ...patch, updated_at: new Date().toISOString() } as never, { onConflict: "chat_id" });
  if (error) throw error;
}

/** Ownership survives admin un-verification; only the original account can reuse the ID. */
export async function traderIdOwnedByAnother(traderId: string, chatId: number) {
  const sb = await db();
  const { data, error } = await sb.from("trader_id_owners").select("chat_id").eq("trader_id", traderId).maybeSingle();
  if (error) throw error;
  return data !== null && data.chat_id !== chatId;
}

export async function sayTraderIdOwned(chatId: number) {
  await say(chatId, "❌ Yeh Trader ID pehle se kisi doosre Telegram account se verified hai. Apni Trader ID bhejein — ek Trader ID sirf ek Telegram account par use ho sakti hai.", { inline_keyboard: [B.navRow()] });
}

export async function showMainMenu(chatId: number) {
  const [s, u] = await Promise.all([loadSettings(), getUser(chatId)]);
  await setUser(chatId, { state: "menu" });
  await say(chatId, B.mainMenuText(s), B.mainMenuKeyboard(!!u?.trader_verified));
}

/** Sends a plain-text (no HTML) message. Every message gets the clickable
 * "Register Now" button. Messages are kept forever. */
export async function sayPlain(chatId: number, text: string, keyboard?: B.InlineKeyboard) {
  const settings = await loadSettings();
  const rows: B.InlineButton[][] = [];
  if (keyboard) rows.push(...keyboard.inline_keyboard);
  const reg = B.regButtonRow(settings.quotex_reg_link);
  if (reg.length) rows.push(reg);
  const kb: B.InlineKeyboard | undefined = rows.length ? { inline_keyboard: rows } : undefined;
  const res = await telegramCall<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...(kb ? { reply_markup: kb } : {}),
  });
  return res;
}

/** Free-text outside the trader-ID / balance states goes to the chat agent,
 * which answers only about account creation, deposit and services. If the
 * agent is unavailable or fails, the user receives a clear notice. */
export async function handleChatMessage(chatId: number, text: string, request: Request) {
  try {
    if (B.needsFreeLearningSupport(text)) {
      await setUser(chatId, { state: "chat" });
      const keyboard = B.faqKeyboard();
      keyboard.inline_keyboard.unshift([{ text: "Our Services", callback_data: "m:browse" }]);
      await sayPlain(chatId, B.freeLearningSupportReply(await loadSettings()), keyboard);
      return;
    }
    {
      const hit = B.matchFaq(text, await loadChatFaqs());
      if (hit) {
        await setUser(chatId, { state: "chat" });
        await sayPlain(chatId, B.redactPrivateSessionContact(hit.answer, await loadSettings()), B.faqKeyboard());
        return;
      }
    }
    const { chatAgentReply } = await import("@/lib/chat-agent.server");
    const reply = await chatAgentReply(request, { text, chatId });
    if (reply) {
      await setUser(chatId, { state: "chat" });
      const keyboard = B.faqKeyboard();
      await sayPlain(chatId, B.redactPrivateSessionContact(reply, await loadSettings()), keyboard);
      return;
    }
  } catch (err) {
    console.error("chat agent failed:", err);
    await sayPlain(chatId, "Abhi AI jawab nahi de saka. Aap ka sawal receive hua hai; team se rabta karein ya baad mein dobara bhejein.", B.faqKeyboard());
    return;
  }
  await sayPlain(chatId, "Abhi AI jawab available nahi hai. Menu se service choose karein ya team se rabta karein.", B.faqKeyboard());
}

export async function showServices(chatId: number) {
  await setUser(chatId, { state: "services" });
  await say(chatId, B.servicesMenuText(), B.servicesKeyboard(await loadServices()));
}

/** Public information only; browsing never grants service access or reveals booking details. */
export async function showServiceOverview(chatId: number) {
  const services = await loadServices();
  await sayPlain(chatId, ["Amir FX — Available Services", ...services.map((service) => `• ${service.title}`), "Kisi service ke baare mein sawal ho to poochein."].join("\n"), B.faqKeyboard());
}

export async function sendWelcome(chatId: number) {
  await showMainMenu(chatId);
}

/** Applies a verification verdict to the user and sends the correct reply. */
export async function applyVerdict(
  requestId: string,
  outcome: { kind: "verified"; balance: number; deposit: number } | { kind: "not_found" } | { kind: "unknown" },
  affiliateReply: string | null,
) {
  const sb = await db();
  const { data: req } = await sb.from("verification_requests").select("*").eq("id", requestId).maybeSingle();
  if (!req || req.status !== "pending") return { ok: true, already_resolved: true };
  const now = new Date().toISOString();
  const settings = await loadSettings();
  const platform = (req.platform as B.Platform) ?? "quotex";
  const mark = (status: string) =>
    sb.from("verification_requests").update({ status, affiliate_reply: affiliateReply, resolved_at: now }).eq("id", requestId);

  if (outcome.kind === "not_found") {
    await mark("rejected");
    await setUser(req.chat_id, { trader_verified: false, state: `awaiting_id:${platform}` });
    await say(req.chat_id, B.notRegisteredText(req.trader_id, platform, settings), { inline_keyboard: [B.navRow()] });
    return { ok: true, verified: false };
  }
  if (outcome.kind === "unknown") {
    await mark("error");
    await say(req.chat_id, B.unknownReplyText(req.trader_id), { inline_keyboard: [B.navRow()] });
    return { ok: true, verified: false };
  }

  const balance = outcome.balance;
  const rejectOwnership = async () => {
    await mark("rejected");
    await sayTraderIdOwned(req.chat_id);
    return { ok: true, verified: false, reason: "trader_id_owned" };
  };
  if (await traderIdOwnedByAnother(req.trader_id, req.chat_id)) return rejectOwnership();
  try {
    // The database trigger atomically claims the ID, including simultaneous verdicts.
    await setUser(req.chat_id, {
      trader_verified: true,
      trader_id: req.trader_id,
      platform,
      last_balance: balance,
      last_deposit: outcome.deposit,
    });
  } catch (error) {
    if (error && typeof error === "object" && "message" in error && String(error.message).includes("trader_id_owned")) {
      return rejectOwnership();
    }
    throw error;
  }

  if (req.purpose !== "balance_check" || !req.service_key) {
    await mark("verified");
    await say(req.chat_id, B.verifiedText(req.trader_id, balance));
    await showServices(req.chat_id);
    return { ok: true, verified: true };
  }

  const service = (await loadServices()).find((s) => s.service_key === req.service_key);
  if (!service) {
    await mark("error");
    await showServices(req.chat_id);
    return { ok: false };
  }

  if (!B.isEligible(balance, service.min_balance)) {
    await sb
      .from("verification_requests")
      .update({ status: "rejected", affiliate_reply: `[LOW BALANCE] ${affiliateReply ?? ""}`, resolved_at: now })
      .eq("id", requestId);
    await setUser(req.chat_id, { state: `awaiting_balance:${service.service_key}` });
    await say(req.chat_id, B.depositCheckInsufficientText(service, balance), { inline_keyboard: [B.navRow()] });
    return { ok: true, verified: true, eligible: false };
  }

  await mark("verified");
  await setUser(req.chat_id, { state: "services", selected_service: service.service_key });
  await deliverService(req.chat_id, req.trader_id, service, balance, settings);
  return { ok: true, verified: true, eligible: true };
}

async function deliverService(
  chatId: number,
  traderId: string,
  service: B.ServiceInfo,
  balance: number,
  settings: B.BotSettings,
) {
  const sb = await db();
  const nav = { inline_keyboard: [B.navRow()] };

  if (service.service_key === "ai_license") {
    const { data: existing } = await sb
      .from("license_keys")
      .select("key")
      .eq("issued_to_chat_id", chatId)
      .eq("status", "issued")
      .maybeSingle();
    if (existing) {
      await say(chatId, B.alreadyVerifiedKeyText(traderId, existing.key), nav);
      return;
    }
    const { data: key } = await sb.from("license_keys").select("id, key").eq("status", "available").limit(1).maybeSingle();
    if (!key) {
      await say(chatId, B.noKeysText(), nav);
      return;
    }
    const now = new Date().toISOString();
    await sb
      .from("license_keys")
      .update({ status: "issued", issued_to_chat_id: chatId, issued_to_trader_id: traderId, issued_at: now })
      .eq("id", key.id)
      .eq("status", "available");
    await sb
      .from("verified_users")
      .upsert({ chat_id: chatId, trader_id: traderId, license_key_id: key.id }, { onConflict: "chat_id" });
    await say(chatId, B.licenseText(key.key), nav);
    return;
  }

  if (service.service_key === "one_to_one") {
    // Auto-notify the coach's handle with the verified booking details. The
    // handle may not have started the bot yet, so this is best effort — the
    // user always gets the exact message to forward.
    const handle = settings.onetoone_handle || B.DEFAULT_SETTINGS.onetoone_handle;
    await telegramCall("sendMessage", {
      chat_id: handle,
      text:
        `🆕 <b>New One-on-One session request</b>\n` +
        `👤 Trader ID: <b>${traderId}</b> (verified ✅)\n` +
        `💬 Telegram chat: <code>${chatId}</code>\n\n` +
        `"I need one on one personal session, I have verified my id."`,
      parse_mode: "HTML",
    }).catch((e) => console.error("one-to-one notify failed:", e));
    await say(chatId, B.oneToOneText(settings), nav);
    // Copyable booking request: deliberately no registration/navigation buttons.
    await telegramCall("sendMessage", { chat_id: chatId, text: B.PERSONAL_SESSION_REQUEST });
    return;
  }

  // Group services: Trading Series / VIP
  await say(chatId, B.eligibleText(service, balance));
  if (!service.invite_link) {
    await say(chatId, "ℹ️ Group link jald share kiya jaye ga — team aap se rabta kare gi.", nav);
    return;
  }
  await say(chatId, B.linkText(service), {
    inline_keyboard: [[{ text: "🚀 Group Join Karein", url: service.invite_link } as never], B.navRow()],
  });
}

export function verdictFromReply(reply: string, traderId: string) {
  const v = parseAffiliateReply(reply, traderId);
  if (v.kind === "verified") return { kind: "verified" as const, balance: v.balance ?? 0, deposit: v.deposit ?? 0 };
  return v;
}
