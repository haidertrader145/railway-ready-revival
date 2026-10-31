import { describe, expect, it } from "vitest";

import {
  chatAgentSystemPrompt,
  DEFAULT_SETTINGS,
  isEligible,
  isValidTraderId,
  oneToOneText,
  shortfall,
  traderIdLengthIssue,
} from "@/lib/bot";

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
  it("accepts digits-only IDs of 8–9 numbers", () => {
    expect(isValidTraderId("12345678")).toBe(true);
    expect(isValidTraderId("123456789")).toBe(true);
    expect(isValidTraderId("  12345678  ")).toBe(true);
  });
  it("rejects words, letters, symbols and IDs outside 8–9 digits", () => {
    expect(isValidTraderId("yaar")).toBe(false);
    expect(isValidTraderId("12ab")).toBe(false);
    expect(isValidTraderId("123-456")).toBe(false);
    expect(isValidTraderId("1234567")).toBe(false); // 7 digits: too short
    expect(isValidTraderId("1234567890")).toBe(false); // 10 digits: too long
  });
  it("classifies digits-only failures as short or long for the exact message", () => {
    expect(traderIdLengthIssue("1234567")).toBe("short");
    expect(traderIdLengthIssue("1234567890")).toBe("long");
    expect(traderIdLengthIssue("12345678")).toBeNull();
    expect(traderIdLengthIssue("yaar")).toBeNull();
  });
});

describe("one-to-one session rules", () => {
  it("points the user at the session handle and warns against extra messages", () => {
    const text = oneToOneText(DEFAULT_SETTINGS);
    expect(text).toContain("@amirtrader540");
    expect(text).toContain("I need one on one personal session, I have verified my id.");
    expect(text).toContain("koi aur message na bhejein");
  });
  it("onetoone_handle defaults to @amirtrader540", () => {
    expect(DEFAULT_SETTINGS.onetoone_handle).toBe("@amirtrader540");
  });
});

describe("chat agent rules", () => {
  it("only covers account creation, deposit and services, and never promises profits", () => {
    const prompt = chatAgentSystemPrompt(
      { ...DEFAULT_SETTINGS, quotex_reg_link: "https://broker-qx.pro/sign-up/?lid=1211776" },
      [{ service_key: "vip_sessions", title: "VIP Sessions", min_balance: 50, invite_link: null, sort: 2 }],
    );
    expect(prompt).toContain("https://broker-qx.pro/sign-up/?lid=1211776");
    expect(prompt).toContain("Account creation");
    expect(prompt).toContain("Deposit");
    expect(prompt).toContain("VIP Sessions: kam se kam $50");
    expect(prompt).toContain("Kabhi bhi profit ki guarantee");
  });
});
