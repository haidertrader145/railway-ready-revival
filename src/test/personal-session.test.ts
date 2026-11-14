import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/bot";

const mocks = vi.hoisted(() => ({ telegram: vi.fn(async (_method: string, _body: Record<string, unknown>) => ({ message_id: 1 })) }));
vi.mock("@/lib/telegram.server", () => ({ telegramCall: mocks.telegram }));
vi.mock("@/lib/bot-database.server", () => ({ supabaseAdmin: { from: (table: string) => {
  const query = {
    select: () => query, eq: () => query, order: () => query, update: () => query, upsert: () => query,
    maybeSingle: async () => ({ data: table === "verification_requests" ? { id: "req", status: "pending", chat_id: 101, trader_id: "12345678", platform: "quotex", purpose: "balance_check", service_key: "one_to_one" } : null }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null, data: table === "service_config" ? [{ service_key: "one_to_one", title: "One to One", min_balance: 300, sort: 1, invite_link: null }] : [] }).then(resolve),
  };
  return query;
} } }));
import { applyVerdict } from "@/lib/bot.server";

describe("verified personal-session booking", () => {
  beforeEach(() => vi.clearAllMocks());
  it("sends the exact request separately without extra wording or buttons", async () => {
    await applyVerdict("req", { kind: "verified", balance: 300, deposit: 300 }, "verified");
    const userMessages = mocks.telegram.mock.calls.filter((call: unknown[]) => (call[1] as { chat_id: number }).chat_id === 101);
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0]?.[1]).toEqual(expect.objectContaining({ reply_markup: expect.any(Object) }));
    expect(userMessages[1]).toEqual(["sendMessage", { chat_id: 101, text: "I need one on one personal session, I have verified my id." }]);
    expect(mocks.telegram).toHaveBeenCalledWith("sendMessage", expect.objectContaining({ chat_id: DEFAULT_SETTINGS.onetoone_handle }));
  });
});