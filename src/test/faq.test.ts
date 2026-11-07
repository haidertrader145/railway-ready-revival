import { describe, expect, it } from "vitest";
import { faqKeyboard, matchFaq, parseBulkFaqs } from "@/lib/bot";

const faqs = parseBulkFaqs(`Q: VIP kaise join karun | how to join vip
A: VIP ke liye $50 apne account mein rakhein.
Line two.

Q: Signals free hain?
A: Haan, free hain.`);

describe("custom Q&A", () => {
  it("parses bulk blocks with multi-line answers", () => {
    expect(faqs).toHaveLength(2);
    expect(faqs[0]!.answer).toBe("VIP ke liye $50 apne account mein rakhein.\nLine two.");
  });
  it("matches exact and similar wording", () => {
    expect(matchFaq("How to join VIP?", faqs)?.answer).toContain("$50");
    expect(matchFaq("bhai vip kaise join karun", faqs)?.answer).toContain("$50");
    expect(matchFaq("signals free hain kya", faqs)?.answer).toBe("Haan, free hain.");
  });
  it("ignores unrelated messages", () => {
    expect(matchFaq("weather today", faqs)).toBeNull();
  });
  it("prioritizes the full saved question over a shorter related question", () => {
    expect(matchFaq("How do I join VIP?", [
      { question: "join VIP", answer: "Short general answer" },
      { question: "How do I join VIP?", answer: "Exact configured joining answer" },
    ])?.answer).toBe("Exact configured joining answer");
  });
  it("adds Back, Menu and Meri Services buttons", () => {
    const cbs = faqKeyboard().inline_keyboard.flat().map((b) => b.callback_data);
    expect(cbs).toEqual(["nav:back", "nav:menu", "m:services"]);
  });
});
