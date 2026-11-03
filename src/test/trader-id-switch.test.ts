import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { state: "awaiting_balance:vip_sessions", trader_id: "12345678", trader_verified: true, platform: "quotex", last_balance: 100 },
  owned: false,
  inserts: vi.fn(async () => ({ error: null })),
  setUser: vi.fn(async () => {}),
  say: vi.fn(async () => {}),
  sayTraderIdOwned: vi.fn(async () => {}),
  showServices: vi.fn(async () => {}),
}));

vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@/lib/telegram.server", () => ({
  deriveTelegramWebhookSecret: async () => "test-secret",
  safeEqual: (a: string, b: string) => a === b,
  telegramCall: async () => ({}),
}));
vi.mock("@/lib/bot.server", () => ({
  sayTraderIdOwned: mocks.sayTraderIdOwned,
  showServices: mocks.showServices,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null }), insert: mocks.inserts };
    return query;
  } },
}));

import { Route } from "@/routes/api/public/telegram/webhook";

// Route registration is mocked so the real POST handler can run without SSR.
const route = Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } };
async function send(update: Record<string, unknown>) {
  return route.server.handlers.POST({ request: new Request("https://example.test/api/public/telegram/webhook", {
    method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "test-secret" }, body: JSON.stringify(update),
  }) });
}
const message = (id: string) => ({ message: { chat: { id: 101, type: "private" }, text: id } });

describe("switching Trader IDs without sharing ownership", () => {
  beforeEach(() => {
    vi.stubEnv("VERIFIER_SECRET", "test-verifier");
    vi.clearAllMocks();
    mocks.owned = false;
    mocks.user.state = "awaiting_balance:vip_sessions";
  });
  it("lets account 101 submit a different ID and clears old approval and balance until checked", async () => {
    expect((await send(message("87654321"))).status).toBe(200);
    expect(mocks.inserts).toHaveBeenCalledWith(expect.objectContaining({ chat_id: 101, trader_id: "87654321", purpose: "balance_check", service_key: "vip_sessions" }));
    expect(mocks.setUser).toHaveBeenCalledWith(101, { trader_id: "87654321", platform: "quotex", trader_verified: false, last_balance: 0, last_deposit: 0 });
  });
  it("rejects an ID belonging to another Telegram account without changing the current ID", async () => {
    mocks.owned = true;
    await send(message("87654321"));
    expect(mocks.sayTraderIdOwned).toHaveBeenCalledWith(101);
    expect(mocks.inserts).not.toHaveBeenCalled();
    expect(mocks.setUser).not.toHaveBeenCalled();
  });
  it("lets a verified user open Quotex verification again without an admin reset", async () => {
    await send({ callback_query: { id: "tap", data: "m:quotex", message: { message_id: 1, chat: { id: 101 } } } });
    expect(mocks.setUser).toHaveBeenCalledWith(101, { state: "awaiting_id:quotex", platform: "quotex" });
    expect(mocks.showServices).not.toHaveBeenCalled();
  });
  it("allows the original account to recheck its current ID", async () => {
    await send(message("12345678"));
    expect(mocks.inserts).toHaveBeenCalledWith(expect.objectContaining({ trader_id: "12345678" }));
    expect(mocks.setUser).toHaveBeenCalledWith(101, { trader_id: "12345678", platform: "quotex" });
  });
});