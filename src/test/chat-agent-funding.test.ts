import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  streamText: vi.fn((_options: { system: string }) => ({ text: Promise.resolve("VIP access ke liye apne broker account ka balance verify karein.") })),
  createOpenAI: vi.fn(() => ({ responses: () => "test-model" })),
}));
vi.mock("ai", () => ({ streamText: mocks.streamText }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: mocks.createOpenAI }));
vi.mock("@/lib/ai-run-id.server", () => ({
  createLovableAiGatewayRunIdFetch: () => ({ fetch: vi.fn() }),
  getLovableAiGatewayRunId: () => "test-run",
}));
vi.mock("@/lib/bot.server", () => ({
  loadSettings: async () => ({ youtube_link: "https://www.youtube.com/@Amirforexacadmy" }),
  loadServices: async () => [{ service_key: "vip_sessions", title: "VIP Sessions", min_balance: 50, sort: 1, invite_link: null }],
  loadFaqs: async () => [{ question: "Session kab hota hai?", answer: "Tuesday 6pm" }],
}));

import { chatAgentReply } from "@/lib/chat-agent.server";

describe("existing agent funding and support routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("LOVABLE_API_KEY", "test-only-key");
  });

  it("keeps the existing AI integration for an ordinary $50 VIP joining question", async () => {
    const reply = await chatAgentReply(new Request("https://example.test"), { chatId: 101, text: "How do I join VIP with $50 in my own account?" });
    expect(mocks.streamText).toHaveBeenCalledTimes(1);
    expect(reply).toBe(await mocks.streamText.mock.results[0]?.value.text);
  });

  it("supplies saved answers to the existing agent for paraphrased questions", async () => {
    await chatAgentReply(new Request("https://example.test"), { chatId: 101, text: "What time is your session?" });
    expect(mocks.streamText.mock.calls[0]?.[0].system).toContain('"question":"Session kab hota hai?","answer":"Tuesday 6pm"');
    expect(mocks.streamText).toHaveBeenCalledTimes(1);
  });

  it.each(["MA BHUT PARESHAN HU MERA LOSS HO GYA HA.", "I have lost money, how do I join VIP?", "I want to trade but I am worried", "main pareshan hun", "میں پریشان ہوں"])("bypasses promotional AI for distress: %s", async (text) => {
    const reply = await chatAgentReply(new Request("https://example.test"), { chatId: 101, text });
    expect(reply).not.toBeNull();
    expect(mocks.createOpenAI).not.toHaveBeenCalled();
    expect(mocks.streamText).not.toHaveBeenCalled();
  });
});