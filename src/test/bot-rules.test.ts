import { describe, expect, it } from "vitest";

import { isEligible, isValidTraderId, shortfall } from "@/lib/bot";

describe("service balance rules", () => {
  it("Trading Series needs $100: $50 is not eligible and is $50 short", () => {
    expect(isEligible(50, 100)).toBe(false);
    expect(shortfall(50, 100)).toBe(50);
  });
  it("VIP / License need $50: exactly $50 is eligible", () => {
    expect(isEligible(50, 50)).toBe(true);
  });
  it("One-to-One needs $300: $299 is not eligible", () => {
    expect(isEligible(299, 300)).toBe(false);
  });
});

describe("trader ID rules", () => {
  it("accepts digits-only IDs and rejects words, letters and mixed input", () => {
    expect(isValidTraderId("1234567")).toBe(true);
    expect(isValidTraderId("  1234  ")).toBe(true);
    expect(isValidTraderId("yaar")).toBe(false);
    expect(isValidTraderId("12ab")).toBe(false);
    expect(isValidTraderId("123-456")).toBe(false);
    expect(isValidTraderId("123")).toBe(false);
  });
});
