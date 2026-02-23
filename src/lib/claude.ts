import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic;

const MAX_CHUNK_TOKENS = 150_000;

export async function analyzeWithClaude({
  systemPrompt,
  userPrompt,
  maxTokens = 4096,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}) {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return {
    text: textBlock?.type === "text" ? textBlock.text : "",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export function chunkText(text: string, maxChars: number = MAX_CHUNK_TOKENS * 4): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a paragraph boundary
    let splitIndex = remaining.lastIndexOf("\n\n", maxChars);
    if (splitIndex === -1 || splitIndex < maxChars * 0.5) {
      splitIndex = remaining.lastIndexOf("\n", maxChars);
    }
    if (splitIndex === -1 || splitIndex < maxChars * 0.5) {
      splitIndex = maxChars;
    }
    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex);
  }

  return chunks;
}
