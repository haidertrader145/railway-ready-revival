import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  owner: null as { chat_id: number } | null,
  upsertError: null as { message: string } | null,
  request: { id: "request", status: "pending", chat_id: 202, trader_id: "12345678", platform: "quotex", purpose: "id_check", service_key: null },
  writes: [] as { table: string; value: unknown }[],
  telegram: vi.fn(async (_method: string, _body: Record<string, unknown>) => ({ message_id: 1 })),
}));

vi.mock("@/lib/telegram.server", () => ({ telegramCall: mocks.telegram }));
vi.mock("@/lib/bot-database.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        maybeSingle: async () => ({
          data: table === "trader_id_owners" ? mocks.owner : table === "verification_requests" ? mocks.request : null,
          error: null,
        }),
        update: (value: unknown) => { mocks.writes.push({ table, value }); return query; },
        upsert: async (value: unknown) => { mocks.writes.push({ table, value }); return { error: mocks.upsertError }; },
        insert: async () => ({ error: null }),
        then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null }),
      };
      return query;
    },
  },
}));

import { applyVerdict, traderIdOwnedByAnother } from "@/lib/bot.server";

describe("one Trader ID per Telegram account", () => {
  beforeEach(() => {
    mocks.owner = null;
    mocks.upsertError = null;
    mocks.writes.length = 0;
    mocks.telegram.mockClear();
  });
  it("blocks account 202 from the ID already owned by account 101", async () => {
    mocks.owner = { chat_id: 101 };
    expect(await traderIdOwnedByAnother("12345678", 202)).toBe(true);
    expect(await applyVerdict("request", { kind: "verified", balance: 100, deposit: 100 }, "confirmed"))
      .toMatchObject({ verified: false, reason: "trader_id_owned" });
    expect(mocks.writes.filter(w => w.table === "bot_users")).toHaveLength(0);
  });
  it("allows the original account to recheck its own ID after verification is removed", async () => {
    mocks.owner = { chat_id: 101 };
    expect(await traderIdOwnedByAnother("12345678", 101)).toBe(false);
  });
  it("rejects a simultaneous losing claim instead of granting services", async () => {
    mocks.upsertError = { message: "trader_id_owned" };
    expect(await applyVerdict("request", { kind: "verified", balance: 100, deposit: 100 }, "confirmed"))
      .toMatchObject({ verified: false, reason: "trader_id_owned" });
    expect(mocks.writes).toContainEqual({ table: "verification_requests", value: expect.objectContaining({ status: "rejected" }) });
    expect(mocks.telegram.mock.calls.some(call => call[0] === "sendMessage" && JSON.stringify(call[1]).includes("svc:"))).toBe(false);
  });
});