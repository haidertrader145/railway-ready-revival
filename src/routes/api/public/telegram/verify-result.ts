import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { safeEqual } from "@/lib/telegram.server";

const bodySchema = z.object({
  request_id: z.string().uuid(),
  verified: z.boolean(),
  affiliate_reply: z.string().max(2000).optional(),
});

// Called by the bridge with the affiliate bot's reply. The reply text decides
// the result; nothing is guessed — unclear replies are marked as errors.
export const Route = createFileRoute("/api/public/telegram/verify-result")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["VERIFIER_SECRET"];
        const provided = request.headers.get("X-Verifier-Secret") ?? "";
        if (!secret || !safeEqual(provided, secret)) return new Response("Unauthorized", { status: 401 });

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
        const { request_id, affiliate_reply } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: req } = await supabaseAdmin
          .from("verification_requests")
          .select("trader_id")
          .eq("id", request_id)
          .maybeSingle();
        if (!req) return Response.json({ error: "Request not found" }, { status: 404 });

        const E = await import("@/lib/bot.server");
        const verdict = affiliate_reply ? E.verdictFromReply(affiliate_reply, req.trader_id) : { kind: "unknown" as const };
        return Response.json(await E.applyVerdict(request_id, verdict, affiliate_reply ?? null));
      },
    },
  },
});
