import { describe, expect, it } from "vitest";
import { needsFreeLearningSupport } from "@/lib/bot";

describe("free learning support routing", () => {
  it.each(["I have lost money", "ma majboor hu kai kru", "How can I recover my loss?", "main qarz mein hun", "مجھے نقصان ہوا ہے"])("routes financial distress to free support: %s", (message) => {
    expect(needsFreeLearningSupport(message)).toBe(true);
  });

  it.each(["How do I create an account?", "Where are your free classes?", "What is the VIP minimum balance?"])("keeps ordinary service questions in normal chat: %s", (message) => {
    expect(needsFreeLearningSupport(message)).toBe(false);
  });
});