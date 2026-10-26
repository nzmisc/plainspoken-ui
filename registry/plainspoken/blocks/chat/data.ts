import type { ISODate } from "@/registry/plainspoken/lib/dates";

// The shapes the chat blocks draw, and a few invented conversations for the docs and stories.
// ChatMessage is the AI SDK's UIMessage as far as the blocks need it, so useChat's messages can be
// passed straight in, and the blocks themselves don't depend on the SDK.

/**
 * One piece of a message: text, reasoning, a file (attached to a question, or made by the model),
 * or a tool call, whose type is "tool-" and the tool's name. Other kinds (step-start) are skipped.
 */
export interface ChatPart {
  type: string;
  text?: string;
  /**
   * Text and reasoning: "streaming" while it comes in, "done" after. A tool call: "input-streaming"
   * while its input is written, "input-available" while it runs, then "output-available" or
   * "output-error".
   */
  state?: string;
  /** A file's type ("image/png", "application/pdf"), name and address: a data: URL, a path, or attachment:<id> once it is kept in the browser */
  mediaType?: string;
  filename?: string;
  url?: string;
  /** A tool call's id, what it was given (partly, while it is written), and what it gave back */
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

/** Tokens an answer took, all its steps together */
export interface ChatUsage {
  input: number;
  output: number;
  /** Of the output, the tokens spent thinking */
  reasoning?: number;
  /** Of the input, the tokens read from the provider's cache */
  cached?: number;
}

/** What the route adds to an answer, and what the app adds to a message */
export interface ChatMetadata {
  /** The model that answered */
  model?: string;
  /** When the answer started, in ms since 1970 */
  createdAt?: number;
  /** How long the model reasoned before answering */
  reasoningMs?: number;
  /** Why it ended: "stop" (done), "length" (out of tokens), "content-filter" (refused), "tool-calls" (out of steps) */
  finishReason?: string;
  /** Stopped by the person before it was done */
  stopped?: boolean;
  /** A question that was edited and sent again */
  edited?: boolean;
  /** Tokens the answer took */
  usage?: ChatUsage;
  /** What it cost in US dollars: OpenRouter's figure, or worked out from the list prices */
  cost?: number;
  /** The reader's verdict on an answer */
  feedback?: "up" | "down";
  /** Bytes of each attached file, by file name (file parts don't carry a size) */
  sizes?: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  parts: ChatPart[];
  metadata?: ChatMetadata;
}

/**
 * The other versions of a conversation, from edits, regenerated answers and comparisons: a tree of
 * messages, of which the conversation's `messages` are the path that is open.
 */
export interface ChatTree {
  /** Each message's follow-ups, by id, in the order they were made; "" holds the first messages */
  children: Record<string, string[]>;
  /** The follow-up open last under each message, so a branch opens again as it was left */
  chosen: Record<string, string>;
  /** The messages that aren't on the open path, by id */
  stash: Record<string, ChatMessage>;
}

/** What a document is: writing (Markdown), code in one language, or a sheet (CSV) */
export type ChatArtifactKind = "text" | "code" | "sheet";

/** One version of a document */
export interface ChatArtifactVersion {
  content: string;
  /** The model made it with a tool, or you did (an edit, an accepted suggestion, a restore) */
  by: "model" | "you";
  /** What changed, in a few words */
  note?: string;
  createdAt: number;
  /** The tool call that made it, so each is applied once */
  callId?: string;
}

/** A change the model proposes to a text document: one passage, replaced */
export interface ChatEditSuggestion {
  id: string;
  /** The passage as it is, word for word */
  original: string;
  replacement: string;
  /** Why, in one sentence */
  reason: string;
  status?: "accepted" | "rejected";
}

export interface ChatConsoleLine {
  level: "log" | "info" | "warn" | "error" | "result";
  text: string;
}

/** The last run of a code document */
export interface ChatCodeRun {
  /** Index of the version that ran */
  version: number;
  status: "ok" | "error" | "timeout";
  lines: ChatConsoleLine[];
  ms: number;
}

/**
 * A document the model wrote with its tools and that lives beside the conversation: every
 * version is kept, so they can be compared and an older one restored.
 */
export interface ChatArtifact {
  id: string;
  kind: ChatArtifactKind;
  title: string;
  /** Code: its language ("javascript", "python") */
  language?: string;
  versions: ChatArtifactVersion[];
  /** Proposed changes to the version `suggestionsFor` */
  suggestions?: ChatEditSuggestion[];
  suggestionsFor?: number;
  /** Code: the last run */
  run?: ChatCodeRun;
}

export interface ChatConversation {
  id: string;
  title: string;
  /** The model picked for it, used for the next answer */
  model: string;
  createdAt: number;
  /** When the last message was sent; the sidebar sorts on it */
  updatedAt: number;
  messages: ChatMessage[];
  /**
   * Pre-loaded for the demo: its dates were written for a fixed day (CHAT_TODAY), and the sidebar
   * files it as if that day were today, so it doesn't drift into "Older" as time passes. Cleared
   * once a message is sent in it.
   */
  demo?: boolean;
  /** Kept at the top of the sidebar */
  pinned?: boolean;
  /** The other branches: earlier questions before an edit, other answers */
  tree?: ChatTree;
  /** The documents written in it */
  artifacts?: ChatArtifact[];
}

/** The weather tool's answer: a place, the weather there now, and the next days */
export interface ChatWeather {
  place: { name: string; region?: string; country?: string; latitude: number; longitude: number };
  current: { time: string; temperature: number; feelsLike: number; humidity: number; wind: number; code: number; isDay: boolean };
  daily: { date: string; code: number; max: number; min: number; rain: number | null }[];
  units: { temperature: string; wind: string };
}

export type ChatErrorCode =
  | "no-key"
  | "bad-key"
  | "credit"
  | "rate-limit"
  | "network"
  | "refused"
  | "too-long"
  | "too-big"
  | "bad-model"
  | "bad-request"
  | "unavailable"
  | "unknown";

/** A failed request, as the route reports it (JSON in the error's message) */
export interface ChatError {
  code: ChatErrorCode;
  message: string;
}

export interface ChatSuggestion {
  title: string;
  prompt: string;
}

/**
 * A saved prompt, used from the box by typing / and its command. {{name}} in the text is a blank
 * to fill in before it is sent.
 */
export interface ChatPrompt {
  id: string;
  /** Typed after the slash: "email" for /email */
  command: string;
  title: string;
  text: string;
}

export const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  { title: "Compare two things", prompt: "Compare TCP and UDP in a short table: speed, reliability and typical uses." },
  { title: "Write some code", prompt: "Write a Python function that checks whether a string is a palindrome, ignoring spaces and punctuation, with a few tests." },
  { title: "Plan a trip", prompt: "Plan three days in Lisbon on a modest budget: a short list for each day, with one line on why." },
  { title: "Explain an idea", prompt: "Explain what a Bloom filter is to someone who knows basic programming, in under 200 words." },
];

/** The prompt library to start with: each is used from the box as /command */
export const CHAT_PROMPTS: ChatPrompt[] = [
  {
    id: "p-email",
    command: "email",
    title: "Write an email",
    text: "Write a short, friendly email to {{recipient}} about {{topic}}. Plain words, no exclamation marks, and a subject line under 40 characters.",
  },
  {
    id: "p-explain",
    command: "explain",
    title: "Explain simply",
    text: "Explain {{idea}} to someone who is new to it, in under 200 words, with one everyday example.",
  },
  {
    id: "p-review",
    command: "review",
    title: "Review code",
    text: "Review this code for bugs and unclear names. List the problems first, most serious at the top, then show a fixed version.\n\n{{code}}",
  },
  {
    id: "p-tldr",
    command: "tldr",
    title: "Sum up",
    text: "Sum this up in three bullet points, each under 20 words:\n\n{{text}}",
  },
  {
    id: "p-doc",
    command: "doc",
    title: "Start a document",
    text: "Start a document titled “{{title}}”: {{what}}. Write it as a document I can edit, not in the chat.",
  },
];

// ---------------------------------------------------------------------------------------------
// The demo's conversations, on a fixed day so the sidebar groups them the same way every time

export const CHAT_TODAY: ISODate = "2026-10-24";

const at = (day: number, h: number, m: number) => Date.UTC(2026, 9, day, h, m);
/** Another month of 2026 (1 = January) */
const on = (month: number, day: number, h: number, m: number) => Date.UTC(2026, month - 1, day, h, m);

const text = (id: string, role: "user" | "assistant", t: string, metadata?: ChatMetadata): ChatMessage => ({
  id,
  role,
  parts: [{ type: "text", text: t, state: "done" }],
  metadata,
});

const SOURDOUGH = `## The first week

A new starter needs flour, water and a warm spot, 24–26 °C if you can. Feed it once a day until it wakes up, then twice.

| Day | Flour (g) | Water (g) | What to expect |
| --- | ---: | ---: | --- |
| 1 | 50 | 50 | Nothing much |
| 2 | 50 | 50 | A few bubbles; discard half first |
| 3–4 | 50 | 50 | Often a burst, then quiet |
| 5–7 | 100 | 100 | Doubles within 6–8 hours; feed twice a day |

**Tips**

- Use whole rye or whole wheat for the first feeds: there is more wild yeast on it.
- Put a rubber band round the jar at the level after feeding, so you can see the rise.
- A grey liquid on top (*hooch*) means it is hungry, not dead. Pour it off and feed.

> The quiet days 3–4 are normal. The first bubbles are mostly bacteria; the yeast takes over later.

It is ready to bake with when it reliably doubles within 4–6 hours of a feed. A 1 kg bag of rye, about $3 to $4, lasts the week.`;

const DEBOUNCE_REASONING = `They want fewer requests while typing. Two parts: wait for typing to settle (a debounced value), and cancel a request still running when a newer one starts, or a slow early answer can overwrite a later one.

A small hook with \`setTimeout\` in an effect is enough; no need for lodash. Keep it TypeScript and short.`;

const DEBOUNCE = `Wait until the typing stops, then fetch. A small hook does it without a library:

\`\`\`tsx
import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}
\`\`\`

Then fetch on the settled value, and cancel the request that is still running when a newer one starts:

\`\`\`tsx
const query = useDebounced(input);

useEffect(() => {
  if (!query) return;
  const ctrl = new AbortController();
  fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, { signal: ctrl.signal })
    .then((r) => r.json())
    .then(setResults)
    .catch(() => {});
  return () => ctrl.abort();
}, [query]);
\`\`\`

1. \`useDebounced\` waits 300 ms after the last keystroke.
2. The effect's cleanup aborts the old request, so a slow early answer can't overwrite a newer one.

[AbortController on MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) has the details.`;

const DELAY = `Between **200 and 400 ms**. Below 200 you still fetch on most keystrokes; above 400 the box starts to feel slow.

- **300 ms** is a good default for a search that goes to the server.
- **150 ms** is fine when the filtering happens in the page, on data you already have.

If results take long to arrive, show that something is happening (a small spinner in the box) rather than lowering the delay.`;

const RAIN = `### Keep dry

- [x] A waterproof jacket with a long back
- [x] Mudguards, front and back: they matter more than anything you wear
- [ ] Waterproof trousers, or a rain cape
- [ ] Overshoes, or a spare pair of socks at work

### Be seen

Rain cuts how far drivers can see. Run **lights in the daytime** too, and wear something bright on top.

### At work

Hang wet things where air moves. A jacket dries in a few hours; shoes take a day, faster with newspaper stuffed in them.`;

const CARD = `Here are three, from warm to light:

1. *Twenty-two years of deadlines met, jams cleared and favours done. The print room won't be the same, and neither will we. Enjoy every slow morning.*
2. *Thank you for all the times you squeezed "one more job" in before five. Wishing you a retirement with no queue at all.*
3. *You kept`;

// Math the four ways models write it: $…$, \(…\), \[…\] and $$…$$
const QUADRATIC = String.raw`For $ax^2 + bx + c = 0$ with $a \neq 0$, the roots are $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

The part under the root, \(b^2 - 4ac\), says how many real roots there are: two if it is positive, one if it is zero, none if it is negative.

The area under $x^2$ from 0 to 1:

\[
\int_0^1 x^2 \, dx = \left[ \frac{x^3}{3} \right]_0^1 = \frac{1}{3}
\]

A rotation in the plane by an angle $\theta$ is this matrix:

$$
R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
$$`;

const REVIEW = `Here it is as a flowchart:

\`\`\`mermaid
flowchart TD
  A[Open a pull request] --> B{CI passes?}
  B -- no --> C[Fix and push]
  C --> B
  B -- yes --> D{Review}
  D -- changes asked --> C
  D -- approved --> E[Merge]
\`\`\`

The loop from **Review** back to **Fix and push** is where most of the time goes; small pull requests keep it short.`;

const BINARY = `Binary search is **O(log n)**: each step halves what is left.

Starting from \`n\` items, after \`k\` steps there are \`n / 2^k\` left. It stops when one is left, so \`n / 2^k = 1\`, which gives \`k = log₂ n\`.

For a million sorted items that is about 20 comparisons, against up to a million for a scan from the start.`;

const JEST = `Usually something the tests share. In the full run it is, in rough order of likelihood:

1. **State left behind** by an earlier test: a module-level cache, a mocked function never restored, rows in a test database
2. **Timers**: a real \`setTimeout\` racing a fake one
3. **Order**: a test that only passes after another has set something up

Run the file alone and then in the order it fails in, without parallel workers:

\`\`\`bash
npx jest --runInBand --randomize src/tide-table.test.ts
\`\`\`

If \`--randomize\` makes it fail sooner, it is shared state: add \`afterEach(() => jest.restoreAllMocks())\` and look for module-level variables.`;

const COVER = `Three short paragraphs work best:

1. **Why this library**: one concrete thing about it you admire, such as the Saturday homework club
2. **What you bring**: two examples, with numbers if you have them ("ran a weekly reading group of 15 for two years")
3. **A close**: when you could start, and that you'd be glad to talk

Keep it under 300 words, and mirror two or three words from the job advert so whoever screens it sees the match.`;

const CSV = `jq doesn't read CSV, but Miller does, and its JSON is what jq expects:

\`\`\`bash
mlr --icsv --ojson cat trips.csv > trips.json
jq '[.[] | select(.distance_km > 10)]' trips.json
\`\`\`

Miller guesses numbers, so \`distance_km\` comes out as a number and the comparison works.`;

const KAYAK = `For two nights, packed in dry bags by when you need them:

- **Day hatch**: water, snacks, sun cream, a warm layer, the chart
- **Front hatch**: tent, sleeping bag, mat
- **Back hatch**: stove, fuel, pot, food for three days (one spare)
- **On deck**: pump, spare paddle, tow line

Heavy things low and near the cockpit; the boat handles better and won't nose-dive into waves.`;

const CRDT = `A CRDT is a data structure that two people can change at the same time, offline, and that always merges back to the same result without asking anyone to resolve a conflict.

The trick is choosing operations that don't care about order. A counter that only adds is the simplest: whatever order the increments arrive in, the total is the same. Shared text editors use the same idea with more care: every character gets an identity, so "insert after this character" means the same thing on every copy.`;

const PANDAS = `Pass a dictionary of old name to new:

\`\`\`python
trips = trips.rename(columns={"dist": "distance_km", "dur": "duration_min"})
\`\`\`

To tidy every column at once, pass a function instead: \`trips.columns = trips.columns.str.lower().str.replace(" ", "_")\`.`;

const HERBS = `A north-facing balcony gets little direct sun, so choose herbs that grow in shade:

| Herb | Copes with shade | Notes |
| --- | --- | --- |
| Mint | Well | Give it its own pot: it spreads |
| Parsley | Well | Slow to start from seed |
| Chives | Fairly | Cut often to keep it going |
| Basil | Poorly | Wants sun and warmth; skip it |

Water less than you think: pots in shade dry out slowly.`;

export const CHAT_CONVERSATIONS: ChatConversation[] = (
  [
  {
    id: "sourdough",
    title: "Sourdough starter, first week",
    model: "anthropic/claude-haiku-5.5",
    createdAt: at(23, 11, 2),
    updatedAt: at(23, 11, 3),
    messages: [
      text("s1", "user", "I'm starting a sourdough starter this weekend. What does a feeding schedule look like for the first week?"),
      text("s2", "assistant", SOURDOUGH, { model: "anthropic/claude-haiku-5.5", createdAt: at(23, 11, 3), finishReason: "stop" }),
    ],
  },
  {
    id: "debounce",
    title: "Debounce a search box in React",
    model: "anthropic/claude-sonnet-5.5",
    createdAt: at(23, 9, 40),
    updatedAt: at(23, 9, 46),
    messages: [
      text("d1", "user", "How do I debounce a search box in React so it doesn't fetch on every keystroke?"),
      {
        id: "d2",
        role: "assistant",
        parts: [
          { type: "reasoning", text: DEBOUNCE_REASONING, state: "done" },
          { type: "text", text: DEBOUNCE, state: "done" },
        ],
        metadata: { model: "anthropic/claude-sonnet-5.5", createdAt: at(23, 9, 41), reasoningMs: 4200, finishReason: "stop" },
      },
      text("d3", "user", "What delay should I use?"),
      text("d4", "assistant", DELAY, { model: "anthropic/claude-haiku-5.5", createdAt: at(23, 9, 46), finishReason: "stop" }),
    ],
  },
  {
    id: "review",
    title: "Code review as a diagram",
    model: "anthropic/claude-haiku-5.5",
    createdAt: at(24, 13, 30),
    updatedAt: at(24, 13, 31),
    messages: [
      text("v1", "user", "Draw our code review as a diagram: open a pull request, CI runs, a reviewer approves or asks for changes, then merge."),
      text("v2", "assistant", REVIEW, { model: "anthropic/claude-haiku-5.5", createdAt: at(24, 13, 31), finishReason: "stop" }),
    ],
  },
  {
    id: "quadratic",
    title: "Quadratic roots and an integral",
    model: "google/gemini-3.8-flash",
    createdAt: at(24, 10, 20),
    updatedAt: at(24, 10, 22),
    messages: [
      text("q1", "user", "How do I solve a quadratic equation? What is the area under x² from 0 to 1? And what does a 2D rotation matrix look like?"),
      text("q2", "assistant", QUADRATIC, { model: "google/gemini-3.8-flash", createdAt: at(24, 10, 22), finishReason: "stop" }),
    ],
  },
  {
    id: "rain",
    title: "Rain gear for a bike commute",
    model: "openai/gpt-6-luna",
    createdAt: at(21, 13, 15),
    updatedAt: at(21, 13, 16),
    messages: [
      text("r1", "user", "What do I need for a 12 km bike commute in the rain?"),
      text("r2", "assistant", RAIN, { model: "openai/gpt-6-luna", createdAt: at(21, 13, 16), finishReason: "stop" }),
    ],
  },
  {
    id: "card",
    title: "Retirement card for the print room",
    model: "qwen/qwen3.8-flash",
    createdAt: at(20, 12, 30),
    updatedAt: at(20, 12, 31),
    messages: [
      text("c1", "user", "Help me write a short message for a colleague's retirement card.\nShe ran the print room for 22 years."),
      text("c2", "assistant", CARD, { model: "qwen/qwen3.8-flash", createdAt: at(20, 12, 31), stopped: true }),
    ],
  },
  {
    id: "binary",
    title: "Why binary search is log n",
    model: "deepseek/deepseek-v4.1-flash",
    createdAt: at(2, 10, 5),
    updatedAt: at(2, 10, 6),
    messages: [
      text("b1", "user", "Why is binary search O(log n)?"),
      text("b2", "assistant", BINARY, { model: "deepseek/deepseek-v4.1-flash", createdAt: at(2, 10, 6), finishReason: "stop" }),
    ],
  },
  short("jest", "A flaky Jest test", "A Jest test passes on its own but fails in the full run. Where do I start?", JEST, "anthropic/claude-haiku-5.5", at(23, 16, 40)),
  short("cover", "Cover letter for a library job", "How should I structure a cover letter for a library assistant job? I've volunteered at a reading group.", COVER, "openai/gpt-6-luna", at(19, 18, 5)),
  short("csv", "CSV to JSON with jq", "Can jq turn a CSV of kayak trips into JSON?", CSV, "deepseek/deepseek-v4.1-flash", at(18, 14, 20)),
  short("kayak", "Packing for two nights by kayak", "What should I pack for two nights of sea kayak camping?", KAYAK, "anthropic/claude-haiku-5.5", on(9, 12, 8, 30)),
  short("crdt", "CRDTs, simply", "Explain CRDTs simply.", CRDT, "anthropic/claude-sonnet-5.5", on(8, 30, 20, 10)),
  short("pandas", "Rename columns in pandas", "How do I rename two columns in a pandas DataFrame?", PANDAS, "qwen/qwen3.8-flash", on(6, 5, 11, 45)),
  short("herbs", "Herbs for a north-facing balcony", "Which herbs grow on a north-facing balcony?", HERBS, "google/gemini-3.8-flash", on(5, 2, 9, 15)),
  ] satisfies ChatConversation[]
).map((c) => ({ ...c, demo: true }));

/** A conversation of one question and its answer */
function short(id: string, title: string, question: string, reply: string, model: string, when: number): ChatConversation {
  return {
    id,
    title,
    model,
    createdAt: when - 60_000,
    updatedAt: when,
    messages: [text(`${id}1`, "user", question), text(`${id}2`, "assistant", reply, { model, createdAt: when, finishReason: "stop" })],
  };
}

/** A conversation of the demo's, by id */
export const chatConversation = (id: string) => CHAT_CONVERSATIONS.find((c) => c.id === id)!;
