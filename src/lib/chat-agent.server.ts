// Server-only: the bot's free-chat agent. It answers ONLY about account
// creation (registration link), deposit requirements and the community's
// services — anything else gets a polite redirect back to the menu topics.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "@/lib/ai-run-id.server";
import { loadServices, loadSettings } from "@/lib/bot.server";
import * as B from "@/lib/bot";

const CHAT_MODEL = "openai/gpt-6-astra";

export async function chatAgentReply(
  request: Request,
  input: { text: string; chatId: number },
): Promise<string | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;

  const [settings, services] = await Promise.all([loadSettings(), loadServices()]);
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const messages: ModelMessage[] = [
    { role: "user", content: `User ka message: ${input.text.slice(0, 1000)}` },
  ];

  const result = streamText({
    model: provider.responses(CHAT_MODEL),
    system: B.chatAgentSystemPrompt(settings, services),
    messages,
    abortSignal: request.signal,
    maxOutputTokens: 600,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = (await result.text).trim();
  return text || null;
}
