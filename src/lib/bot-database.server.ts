import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Dedicated external bot database; never falls back to the managed database. */
export function createBotDatabaseClient() {
  const url = process.env["EXTERNAL_DB_URL"] ?? "https://yyhkhqcqeppavpvdiflv.supabase.co";
  const key = process.env["EXTERNAL_DB_SERVER_KEY"];
  if (!key) throw new Error("External bot database server credential is not configured");
  return createClient<Database>(url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, ""), key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

// Create on access inside a server handler, not at import time. Keep credentials server-only.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createBotDatabaseClient>, {
  get(_target, property) {
    const client = createBotDatabaseClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});