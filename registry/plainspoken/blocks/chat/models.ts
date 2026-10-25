// The models the chat may use, and the limits on a request. The route only accepts these ids, so
// this list is also the allow-list: add a model here and it can be picked and is let through.

export interface ChatModel {
  /** OpenRouter's id, "maker/model" */
  id: string;
  /** What the picker shows */
  name: string;
  maker: string;
  /** US dollars per million tokens: what goes in (the conversation so far) and what comes out */
  input: number;
  output: number;
  /** The picker's group: the cheap fast ones first, then the one stronger model */
  tier: "fast" | "strong";
}

export const CHAT_MODELS: ChatModel[] = [
  { id: "anthropic/claude-haiku-5.5", name: "Claude Haiku 5.5", maker: "Anthropic", input: 0.1, output: 0.5, tier: "fast" },
  { id: "openai/gpt-6-luna", name: "GPT-6 Luna", maker: "OpenAI", input: 0.1, output: 0.5, tier: "fast" },
  { id: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash", maker: "Google", input: 0.825, output: 4.125, tier: "fast" },
  { id: "deepseek/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", maker: "DeepSeek", input: 0.02, output: 1, tier: "fast" },
  { id: "qwen/qwen3.8-flash", name: "Qwen3.8 Flash", maker: "Qwen", input: 0.15, output: 0.47, tier: "fast" },
  { id: "anthropic/claude-sonnet-5.5", name: "Claude Sonnet 5.5", maker: "Anthropic", input: 2, output: 10, tier: "strong" },
];

export const DEFAULT_CHAT_MODEL = "anthropic/claude-haiku-5.5";

/** What one request may cost at most: the route enforces these, the app trims to them before sending */
export const CHAT_LIMITS = {
  /** Tokens an answer may have */
  maxOutputTokens: 2000,
  /** Tokens the model may think for first, when thinking is on; the cap rises by as much, as they count as output */
  reasoningTokens: 2000,
  /** The last this many messages go to the model; older ones are left out */
  maxMessages: 40,
  /** Characters of conversation sent, at most; the oldest messages go first */
  maxInputChars: 60_000,
} as const;

export function chatModel(id: string | undefined): ChatModel | undefined {
  return CHAT_MODELS.find((m) => m.id === id);
}

export function isChatModel(id: unknown): id is string {
  return typeof id === "string" && CHAT_MODELS.some((m) => m.id === id);
}

/** The display name for a model id, or the id itself for one no longer on the list */
export function chatModelName(id: string | undefined): string {
  return chatModel(id)?.name ?? id ?? "Assistant";
}

// Cents always, a third decimal only when there is one: $0.10, $0.825, $2.00
const usd = (n: number) => `$${n.toFixed(3).replace(/0$/, "")}`;

/** "$0.10 in, $0.50 out": dollars per million tokens */
export function formatChatPrice(m: ChatModel): string {
  return `${usd(m.input)} in, ${usd(m.output)} out`;
}
