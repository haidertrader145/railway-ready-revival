import { afterEach, describe, expect, it, vi } from "vitest";
import { createBotDatabaseClient } from "@/lib/bot-database.server";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("external bot database routing", () => {
  it("reads from the configured external database, without managed credentials", async () => {
    vi.stubEnv("EXTERNAL_DB_URL", "https://external.example.test/rest/v1/");
    vi.stubEnv("EXTERNAL_DB_SERVER_KEY", "sb_secret_test_fixture");
    vi.stubEnv("SUPABASE_URL", "https://managed.example.test");
    const fetchMock = vi.fn(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await createBotDatabaseClient().from("bot_faqs").select("question, answer");
    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe("https://external.example.test/rest/v1/bot_faqs?select=question%2Canswer");
    expect(new Headers(options.headers).has("Authorization")).toBe(false);
  });
  it("fails when the external credential is missing rather than writing to Cloud", () => {
    vi.stubEnv("EXTERNAL_DB_SERVER_KEY", "");
    expect(() => createBotDatabaseClient()).toThrow("External bot database server credential is not configured");
  });
});