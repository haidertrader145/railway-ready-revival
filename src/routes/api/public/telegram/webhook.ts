// Telegram delivers updates here. The request must carry
// X-Telegram-Bot-Api-Secret-Token matching either the verifier-derived value
// (sha256 of "telegram-webhook:verifier:<VERIFIER_SECRET>") or the bot
// connection key value (sha256 of "telegram-webhook:<TELEGRAM_API_KEY>"), so
// the webhook keeps working while a connection key is being rotated.
import { createFileRoute } from "@tanstack/react-router";

import * as B from "@/lib/bot";
import { deriveTelegramWebhookSecret, safeEqual, telegramCall } from "@/lib/telegram.server";

type TelegramUpdate = {
  update_id?: number;
  message?: { message_id?: number; chat?: { id?: number; type?: string }; text?: string };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
};

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const telegramKey = process.env["TELEGRAM_API_KEY"];
        const verifier = process.env["VERIFIER_SECRET"];
        if (!telegramKey && !verifier) return new Response("Not configured", { status: 500 });

        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        const candidates: string[] = [];
        if (verifier) candidates.push(await deriveTelegramWebhookSecret(`verifier:${verifier}`));
        if (telegramKey) candidates.push(await deriveTelegramWebhookSecret(telegramKey));
        if (!candidates.some((c) => safeEqual(actual, c))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as TelegramUpdate;
        const E = await import("@/lib/bot.server");

        try {
          await E.cleanupExpired().catch(() => {});

          if (update.callback_query) {
            const cq = update.callback_query;
            const chatId = cq.message?.chat.id;
            await telegramCall("answerCallbackQuery", { callback_query_id: cq.id }).catch(() => {});
            if (!chatId) return Response.json({ ok: true });
            // Keep the chat tidy: remove the menu that was tapped.
            if (cq.message) await E.deleteMsg(chatId, cq.message.message_id);
            await handleButton(chatId, cq.data ?? "", E);
            return Response.json({ ok: true });
          }

          const msg = update.message;
          const chatId = msg?.chat?.id;
          const text = msg?.text?.trim();
          if (!chatId || !text || msg?.chat?.type !== "private") return Response.json({ ok: true });

          const settings = await E.loadSettings();
          if (msg.message_id) await E.track(chatId, msg.message_id, settings.autodelete_minutes);

          if (text.startsWith("/start")) {
            await E.sendWelcome(chatId);
            return Response.json({ ok: true });
          }
          if (text.startsWith("/menu")) {
            await E.showMainMenu(chatId);
            return Response.json({ ok: true });
          }

          const user = await E.getUser(chatId);
          const state = user?.state ?? "new";
          const awaitingId = state.startsWith("awaiting_id:");
          const awaitingBal = state.startsWith("awaiting_balance:");
          if (!awaitingId && !awaitingBal) {
            // Free chat: the agent answers only about account creation,
            // deposit and services. Trader-ID states never reach this.
            await E.handleChatMessage(chatId, text, request);
            return Response.json({ ok: true });
          }

          const traderId = text.replace(/\s+/g, "");
          if (!B.isValidTraderId(traderId)) {
            await E.say(chatId, B.invalidIdText(), { inline_keyboard: [B.navRow()] });
            return Response.json({ ok: true });
          }

          const platform = (awaitingId ? state.split(":")[1] : user?.platform) ?? "quotex";
          const serviceKey = awaitingBal ? (state.split(":")[1] ?? null) : null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Expire stale pending checks first so a stuck one never blocks a retry.
          await E.expireStalePending().catch(() => {});
          const { data: pending } = await supabaseAdmin
            .from("verification_requests")
            .select("id")
            .eq("chat_id", chatId)
            .eq("status", "pending")
            .maybeSingle();
          if (pending) {
            await E.say(chatId, B.pendingRequestText(traderId));
            return Response.json({ ok: true });
          }

          await supabaseAdmin.from("verification_requests").insert({
            chat_id: chatId,
            trader_id: traderId,
            platform,
            purpose: awaitingBal ? "balance_check" : "id_check",
            service_key: serviceKey,
          });
          await E.setUser(chatId, { trader_id: traderId, platform });
          await E.say(chatId, B.verifyingText(traderId));
          return Response.json({ ok: true });
        } catch (err) {
          console.error("webhook error:", err);
          return Response.json({ ok: true });
        }
      },
    },
  },
});

async function handleButton(chatId: number, data: string, E: typeof import("@/lib/bot.server")) {
  const settings = await E.loadSettings();
  const user = await E.getUser(chatId);

  if (data === "nav:menu") return E.showMainMenu(chatId);
  if (data === "nav:back") {
    const st = user?.state ?? "";
    if (st.startsWith("awaiting_balance:") || (st === "services" && false)) return E.showServices(chatId);
    return E.showMainMenu(chatId);
  }
  if (data === "m:learn") {
    await E.setUser(chatId, { state: "learning" });
    return E.say(chatId, B.learningText(settings), { inline_keyboard: [B.navRow()] });
  }
  if (data === "m:quotex") {
    // Quotex is the only platform; stale "m:pocket" taps fall through to the menu.
    const platform: B.Platform = "quotex";
    // Switching platform resets verification.
    if (user?.platform && user.platform !== platform) {
      await E.setUser(chatId, { trader_verified: false, last_balance: 0, last_deposit: 0 });
    }
    if (user?.trader_verified && user.platform === platform) return E.showServices(chatId);
    await E.setUser(chatId, { state: `awaiting_id:${platform}`, platform });
    return E.say(chatId, B.askTraderIdText(platform, settings), { inline_keyboard: [B.navRow()] });
  }
  if (data === "m:services") {
    if (!user?.trader_verified) return E.showMainMenu(chatId);
    return E.showServices(chatId);
  }
  if (data.startsWith("svc:")) {
    const key = data.slice(4);
    const service = (await E.loadServices()).find((s) => s.service_key === key);
    if (!service || !user?.trader_verified) return E.showMainMenu(chatId);
    await E.setUser(chatId, { state: `awaiting_balance:${key}`, selected_service: key });
    const bal = Number(user.last_balance ?? 0);
    const intro = B.isEligible(bal, service.min_balance)
      ? `🎯 <b>${service.title}</b>\n📌 Required balance: <b>${B.money(service.min_balance)}</b>\n\n`
      : `${B.insufficientText(service, bal)}\n\n`;
    return E.say(
      chatId,
      `${intro}🔄 Balance confirm karne ke liye apni <b>Trader ID</b> dobara bhejein.`,
      { inline_keyboard: [B.navRow()] },
    );
  }
  return E.showMainMenu(chatId);
}
