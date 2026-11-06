import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), deleted: { data: { id: 42 }, error: null } as { data: { id: number } | null; error: { message: string } | null }, eq: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  inputValidator: (validate: (input: unknown) => unknown) => ({ handler: (run: (args: { data: unknown }) => unknown) => (args: { data: unknown }) => run({ data: validate(args.data) }) }),
  handler: (run: () => unknown) => run,
}) }));
vi.mock("@tanstack/react-start/server", () => ({ useSession: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
import { deleteLicenseKey } from "@/lib/admin.functions";

describe("selected license deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleted = { data: { id: 42 }, error: null };
    const query = { delete: () => query, eq: mocks.eq, select: () => query, maybeSingle: async () => mocks.deleted };
    mocks.eq.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
  });
  it("deletes only key 42 without changing verification records", async () => {
    await expect(deleteLicenseKey({ data: { id: 42 } })).resolves.toEqual({ ok: true });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("license_keys");
    expect(mocks.eq).toHaveBeenCalledWith("id", 42);
  });
  it("reports a failed deletion instead of claiming success", async () => {
    mocks.deleted = { data: null, error: { message: "Delete failed" } };
    await expect(deleteLicenseKey({ data: { id: 42 } })).rejects.toThrow("Delete failed");
  });
  it("rejects invalid key IDs before contacting storage", async () => {
    await expect(async () => deleteLicenseKey({ data: { id: -1 } })).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});