"use server";

const MODEL_DEFAULTS = {
  chat: process.env.AI_MODEL_CHAT ?? "nvidia/nemotron-3.5-lightning:free",
  analysis: process.env.AI_MODEL_ANALYSIS ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  dossier: process.env.AI_MODEL_DOSSIER ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  fallback: process.env.AI_MODEL_FALLBACK ?? "openrouter/free",
} as const;

type ModelType = keyof typeof MODEL_DEFAULTS;

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function callLLM(
  type: ModelType,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY non configurée.");

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let model = MODEL_DEFAULTS[type];
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://elmes-teka.vercel.app",
            "X-Title": "ELMES-TEKA",
          },
          body: JSON.stringify({ model, messages, max_tokens: 1024 }),
        },
      );

      if (response.status === 429 && attempts < maxAttempts) {
        // Quota dépassé → fallback puis retry avec backoff
        model = MODEL_DEFAULTS.fallback;
        await new Promise((r) => setTimeout(r, attempts * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter error ${response.status}`);
      }

      const data = await response.json() as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Réponse vide du modèle IA.");
      return content;
    } catch (err) {
      if (attempts >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, attempts * 1000));
    }
  }

  throw new Error("Échec après plusieurs tentatives.");
}
