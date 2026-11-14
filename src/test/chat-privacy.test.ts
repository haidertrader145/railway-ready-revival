import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, chatAgentSystemPrompt } from "@/lib/bot";

const mocks = vi.hoisted(() => ({
  telegram: vi.fn(async (_method: string, _body: Record<string, unknown>) => ({ message_id: 1 })),
  agent: vi.fn(async () => "Contact @amirtrader540 or https://t.me/amirtrader540"),
  faqs: [{ question: "How do I contact you?", answer: "Contact @amirtrader540 or https://t.me/amirtrader540" }],
}));
vi.mock("@/lib/telegram.server", () => ({ telegramCall: mocks.telegram }));
vi.mock("@/lib/chat-agent.server", () => ({ chatAgentReply: mocks.agent }));
vi.mock("@/lib/bot-database.server", () => ({ supabaseAdmin: { from: (table: string) => {
  const query = {
    select: () => query, order: () => query, limit: () => query, upsert: () => query,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null, data: table === "bot_faqs" ? mocks.faqs : [] }).then(resolve),
  };
  return query;
} } }));
import { handleChatMessage } from "@/lib/bot.server";

function lastBody() { return mocks.telegram.mock.calls.at(-1)?.[1]; }
describe("private session contact in general chat", () => {
  beforeEach(() => vi.clearAllMocks());
  it("does not disclose the private contact in the agent knowledge including saved data", () => {
    const prompt = chatAgentSystemPrompt(DEFAULT_SETTINGS, [], mocks.faqs);
    expect(prompt.toLowerCase()).not.toContain("amirtrader540");
  });
  it("does not disclose the private contact in a direct saved answer", async () => {
    await handleChatMessage(101, "How do I contact you?", new Request("https://example.test"));
    expect(String(lastBody()?.['text']).toLowerCase()).not.toContain("amirtrader540");
    expect(mocks.agent).not.toHaveBeenCalled();
  });
  it("does not disclose the private contact in a generated reply", async () => {
    await handleChatMessage(101, "Tell me about your community", new Request("https://example.test"));
    expect(String(lastBody()?.['text']).toLowerCase()).not.toContain("amirtrader540");
  });
  it("delivers an ordinary saved answer unchanged without calling AI", async () => {
    mocks.faqs.push({ question: "Are beginners welcome?", answer: "Yes, beginners are welcome." });
    await handleChatMessage(101, "Are beginners welcome?", new Request("https://example.test"));
    expect(lastBody()?.['text']).toBe("Yes, beginners are welcome.");
    expect(mocks.agent).not.toHaveBeenCalled();
  });
  it("offers information-only service browsing for distress without exposing private contact", async () => {
    await handleChatMessage(101, "I am worried and in loss", new Request("https://example.test"));
    const markup = lastBody()?.['reply_markup'] as { inline_keyboard: { callback_data?: string }[][] };
    expect(markup.inline_keyboard.flat().map((button) => button.callback_data)).toContain("m:browse");
    expect(String(lastBody()?.['text']).toLowerCase()).not.toContain("amirtrader540");
    expect(mocks.agent).not.toHaveBeenCalled();
  });
});
