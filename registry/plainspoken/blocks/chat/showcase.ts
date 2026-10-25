import type { ChatConversation, ChatMessage, ChatMetadata } from "@/registry/plainspoken/blocks/chat/data";

// The demo's showcase: one long, invented conversation (two people launching a tide-times app for
// sea kayakers) whose answers use everything the chat can draw: headings, lists, task lists,
// quotes, tables, code in several languages, math, Mermaid diagrams, footnotes and a picture.
// Dated for CHAT_TODAY like the other demo conversations.

const F = "```";
const at = (h: number, m: number) => Date.UTC(2026, 9, 24, h, m);

const ask = (id: string, text: string, metadata?: ChatMetadata): ChatMessage => ({ id, role: "user", parts: [{ type: "text", text, state: "done" }], metadata });

const answer = (id: string, model: string, minute: number, text: string, reasoning?: { text: string; ms: number }): ChatMessage => ({
  id,
  role: "assistant",
  parts: [...(reasoning ? [{ type: "reasoning", text: reasoning.text, state: "done" }] : []), { type: "text", text, state: "done" }],
  metadata: { model, createdAt: at(9, minute), finishReason: "stop", reasoningMs: reasoning?.ms },
});

// 1 ------------------------------------------------------------------------------------------

const PLAN = `## A six-week plan for Tidewater

With two people and little money, the launch is mostly **attention, not ads**. Sea kayakers are a small, close crowd: they meet in clubs, on forums and at the shops that rent out boats. Reach them there, *early*, and let a waitlist do the work.

### The phases

1. **Weeks 1–2: get ready**
   - Finish the tide tables for the first region, and nothing else
   - Put up a one-page site with a waitlist form
   - Write the one sentence that says what Tidewater does
2. **Weeks 3–4: build the list**
   - Post in two or three kayaking forums, as a person rather than a brand
   - Offer clubs a free year for their members
   - ~~Buy ads on social media~~ Skip paid ads: the audience is too small to target well
3. **Weeks 5–6: launch**
   - Submit to the app stores two weeks before launch, not two days
   - Email the waitlist on launch day, then answer every reply

### This week

- [x] Pick the launch date: Saturday 5 December
- [x] Register the domain
- [ ] Draft the landing page
- [ ] List ten clubs and shops to write to

---

> Launch to the people who already want it. Everyone else comes later.

Keep the scope small: the \`v1.0\` that ships is the one that counts.`;

const PLAN_THOUGHT = `Two people, six weeks, almost no budget, and a niche audience. That points to a phased plan: product first, a waitlist early, reach through clubs and forums where kayakers already are, and no paid ads.

Give them phases with concrete tasks, a short list for this week, and one rule to keep them honest.`;

// 2 ------------------------------------------------------------------------------------------

// No-break spaces keep the headers and each week's dates on one line: the table is wider than the
// column and scrolls
const WEEKS = `Here it is, in US dollars, assuming you already pay for hosting. The table is wide: scroll it sideways.

| Week | Dates | Focus | Main\u00a0tasks | Owner | Hours | Sign-ups\u00a0goal | Forum\u00a0posts | Club\u00a0letters | Ads\u00a0($) | Tools\u00a0($) | Total\u00a0($) |
| ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 26\u00a0Oct\u00a0–\u00a01\u00a0Nov | Product | Tide tables for the Solent, bug list to zero | Maren | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | 2\u00a0–\u00a08\u00a0Nov | Site | Landing page, waitlist form, privacy note | Ilya | 24 | 50 | 1 | 0 | 0 | 40 | 40 |
| 3 | 9\u00a0–\u00a015\u00a0Nov | Reach | Posts in three forums, letters to ten clubs | Maren | 16 | 150 | 3 | 10 | 0 | 0 | 0 |
| 4 | 16\u00a0–\u00a022\u00a0Nov | Reach | Club offers, a short demo video | Ilya | 20 | 300 | 2 | 6 | 0 | 120 | 120 |
| 5 | 23\u00a0–\u00a029\u00a0Nov | Stores | Store listings, screenshots, submit for review | Maren | 18 | 350 | 1 | 0 | 0 | 99 | 99 |
| 6 | 30\u00a0Nov\u00a0–\u00a05\u00a0Dec | Launch | Launch email, replies, fixes | Both | 30 | 400 | 2 | 0 | 0 | 0 | 0 |

That is **$259** in all: mostly the developer account ($99) and the video.

The cheapest thing to cut is week 4's video. A screen recording with a voice-over does the same job.`;

// 3 ------------------------------------------------------------------------------------------

const FLOW = `Two views: what a person goes through, and what happens behind the form.

### What they go through

${F}mermaid
flowchart TD
  hear[Hears about Tidewater] --> page

  subgraph page [Landing page]
    direction TB
    visit[Visits the landing page] --> keen{Wants it?}
    keen -- not yet --> leave[Leaves for now]
    keen -- yes --> email[Enters an email address]
    email --> valid{A valid address?}
    valid -- no --> fix[Is told what to fix]
    valid -- yes --> accepted[Address accepted]
  end

  page --> confirm

  subgraph confirm [Confirmation]
    direction TB
    known{Already on the list?} -- yes --> already[Sees: you're already in]
    known -- no --> sent[Gets a confirmation email]
    sent --> clicked{Clicks the link?}
    clicked -- within 3 days --> listed[On the waitlist]
    clicked -- not yet --> remind[Gets one reminder]
    remind -- still nothing --> dropped[Dropped from the list]
  end

  confirm --> launch

  subgraph launch [Launch day]
    direction TB
    batch["Launch-day email goes out to everyone confirmed, in batches of 500 so the replies don't swamp the inbox"] --> opens{Opens it?}
    opens -- yes --> install[Installs the app]
    opens -- no --> nudge[One follow-up a week later]
    install --> year[Free first year applied]
  end

  classDef done fill:var(--background),stroke:var(--chart-2),stroke-width:2px,color:var(--foreground)
  classDef stop fill:var(--background),stroke:var(--destructive),stroke-width:2px,color:var(--foreground)
  classDef goal fill:var(--primary),stroke:var(--primary),color:var(--primary-foreground)
  class accepted,listed,install done
  class leave,dropped stop
  class year goal
${F}

### Behind the form

${F}mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant D as Database
  participant M as Mail service
  B->>A: POST /api/waitlist (email)
  A->>D: insert, unless it exists
  D-->>A: new row, with a token
  A->>M: send confirmation (token)
  A-->>B: 202 Accepted
  Note over B,M: Later, the person clicks the link
  B->>A: GET /api/waitlist?token=…
  A->>D: mark confirmed
  A-->>B: You're on the list
${F}

Confirming the address (*double opt-in*) costs you a few sign-ups, but the list you end up with actually opens its email.`;

const FLOW_THOUGHT = `They need the person's path and the system's. A flowchart with the branches that matter (bad address, already listed, never confirmed) grouped by stage, then a sequence diagram for the request path. Mention why double opt-in is worth it.`;

// 4 ------------------------------------------------------------------------------------------

const ENDPOINT = `Three pieces: a table, the route, and a quick test. First the table:

${F}sql
create table waitlist (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  token       text not null,
  confirmed   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index waitlist_token on waitlist (token);
${F}

Then the route, at \`app/api/waitlist/route.ts\`. \`POST\` adds an address, \`GET\` confirms it:

${F}ts
import { randomBytes } from "node:crypto";
import { sql } from "../../../lib/db";
import { sendConfirmation } from "../../../lib/mail";

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const address = email.trim().toLowerCase();
  const token = randomBytes(24).toString("base64url");

  // One row per address: signing up twice changes nothing
  const rows = await sql\`
    insert into waitlist (email, token)
    values (\${address}, \${token})
    on conflict (email) do nothing
    returning token
  \`;

  if (rows.length === 0) {
    return Response.json({ status: "already-listed" });
  }

  try {
    await sendConfirmation(address, rows[0].token);
  } catch (err) {
    // Keep the row: the reminder job tries again tomorrow
    console.error("waitlist: confirmation not sent", err);
  }

  return Response.json({ status: "check-your-inbox" }, { status: 202 });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 400 });

  const rows = await sql\`
    update waitlist set confirmed = true
    where token = \${token} and not confirmed
    returning email
  \`;

  return Response.redirect(new URL(rows.length ? "/thanks" : "/already", req.url), 303);
}
${F}

Try it from a terminal:

${F}bash
curl -s -X POST http://localhost:3000/api/waitlist \\
  -H 'content-type: application/json' \\
  -d '{"email": "maren@example.com"}'
${F}

which answers:

${F}json
{ "status": "check-your-inbox" }
${F}

Each address goes through a few states, which is worth knowing when you write the reminder job:

${F}mermaid
stateDiagram-v2
  [*] --> Pending: signs up
  Pending --> Confirmed: clicks the link
  Pending --> Reminded: 3 days pass
  Reminded --> Confirmed: clicks the link
  Reminded --> Dropped: 7 more days pass
  Confirmed --> Invited: launch-day email
  Dropped --> [*]
  Invited --> [*]
${F}

The \`on conflict do nothing\` makes the endpoint idempotent[^idempotent]. The [Route Handlers page of the Next.js docs](https://nextjs.org/docs/app/getting-started/route-handlers) covers the rest.

[^idempotent]: Sending the same request twice has the same effect as sending it once, so a double click can't add two rows.`;

const ENDPOINT_THOUGHT = `Next.js route handler plus Postgres. Keep it to one table with a unique email and a token for double opt-in. POST inserts with on conflict do nothing (idempotent, no duplicate rows), sends the confirmation, and doesn't fail the request if mail is down. GET confirms by token and redirects.

Show the schema, the route, a curl test and the JSON it returns. A state diagram of an address's life helps with the reminder job.`;

// 5 ------------------------------------------------------------------------------------------

const EXPECT_MATH = String.raw`About **120**. With a sign-up rate $p = 0.03$ and $n = 4000$ visits, the expected number is $E = n \cdot p = 120$.

How sure you can be depends on how well you know $p$. If the 3% came from a test with 500 visits (15 sign-ups), a 95% interval for the rate is

$$
\hat{p} \pm 1.96\sqrt{\frac{\hat{p}\,(1-\hat{p})}{n}} = 0.03 \pm 0.015
$$

so somewhere between **1.5% and 4.5%**, which is 60 to 180 sign-ups from 4,000 visits.`;

const EXPECT = `${EXPECT_MATH}

| Rate | Sign-ups | Of the goal (300) |
| ---: | ---: | ---: |
| 1.5% | 60 | 20% |
| 3.0% | 120 | 40% |
| 4.5% | 180 | 60% |

So the landing page alone won't reach 300: the club offers have to bring in the rest. The same sums in Python, to try other numbers:

${F}python
from math import sqrt

def expected_signups(visits: int, rate: float, sample: int) -> tuple[int, int, int]:
    """Low, likely and high sign-ups, with a 95% interval on the rate."""
    margin = 1.96 * sqrt(rate * (1 - rate) / sample)
    low, high = max(rate - margin, 0.0), rate + margin
    return round(visits * low), round(visits * rate), round(visits * high)

print(expected_signups(4000, 0.03, 500))  # (60, 120, 180)
${F}`;

const EXPECT_THOUGHT = String.raw`Expected value is just n times p: 4000 × 0.03 = 120. For the uncertainty, assume the 3% came from a small test; with 500 visits the standard error is sqrt(0.03 × 0.97 / 500) ≈ 0.0076, times 1.96 ≈ 0.015. So 1.5% to 4.5%, 60 to 180. Worth comparing with their goal of 300.`;

// 6 ------------------------------------------------------------------------------------------

const EMAIL = `**Subject:** Tidewater is out today

![Tidewater's icon: a wave over a tide line](/demos/chat/tidewater-icon.svg)

> Hello,
>
> You asked to hear when Tidewater was ready. It is, as of this morning: tide times for the Solent, offline, on your phone, with a warning when the stream turns against you.
>
> As one of the first on the list, your first year is free. Open the app and it is already applied.
>
> See you on the water,
> Maren and Ilya

Keep the subject under 40 characters so phones show all of it; this one has 22.`;

// 7 ------------------------------------------------------------------------------------------

const RISKS = `The usual suspects, roughly from most to least likely:

| Risk | Likelihood | What you'd see | What to do |
| --- | :---: | --- | --- |
| Store review runs late | Medium | The app isn't live at 9:00 | Submit by 21 November; hold the email until it is live |
| The email lands in spam | Medium | Few opens; replies that say "found it in spam" | Set up SPF and DKIM now, and send a test to five providers |
| The sign-up spike slows the site | Low | Timeouts on the landing page | It is one table: the index on \`token\` is enough |
| A tide table is wrong | Low | One worried email | Say thank you, fix it, and reply by name |

Two things are **not** worth worrying about yet:

- Scaling the backend
  - A few thousand people won't stretch one small database
  - If it ever does, that is a good problem
- Press coverage
  - ~~Write a press release~~ A personal note to two kayaking magazines is enough
  - Attach the icon and two screenshots, nothing more`;

const RISKS_THOUGHT = `Launch-day risks for a tiny app: store review timing, email deliverability, a traffic spike on the landing page, and data errors in the tide tables. Rank by likelihood, say what each looks like and what to do. Then name what not to worry about so they don't over-prepare.`;

// 8 ------------------------------------------------------------------------------------------

const CHECKLIST = `### The week before launch

- [x] Both apps approved in the stores
- [x] Launch email written and tested
  - [x] Plain-text version
  - [x] Sent to Gmail, Outlook and an iPhone
- [ ] Landing page switched from "Join the waitlist" to "Get the app"
- [ ] Store links checked on a phone that has never seen the app
- [ ] Support inbox: an auto-reply on, and someone watching it on the day
- [ ] A quiet hour blocked out after the email goes, to answer replies

Tick the last one: launch day is mostly answering people.`;

// 9 ------------------------------------------------------------------------------------------

const NO_WEB = `I can't: I have no web access here, so I can't look up anything live, including this week's review times.

What I can say is what tends to hold: most reviews finish within a day or two, and they slow down before holidays. Submitting on **21 November** gives you two weeks of slack, which covers a rejection and a second try.`;

// 10 -----------------------------------------------------------------------------------------

const SINK_MATH = String.raw`Math, inline: the tide's height follows roughly $h(t) = A \cos\!\left(\frac{2\pi t}{T}\right)$, with $T \approx 12.42$ hours. And on a line of its own:

$$
\bar{h} = \frac{1}{T}\int_{0}^{T} h(t)\,dt = 0
$$`;

const SINK = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Text can be **bold**, *italic*, ***both***, ~~struck out~~ or \`inline code\`. Some HTML is allowed, like <kbd>Ctrl</kbd> + <kbd>C</kbd> and H<sub>2</sub>O; the rest shows as text: &lt;marquee&gt;Hello&lt;/marquee&gt;.

Links: [the Tidewater site](https://tidewater.example.com), and bare addresses become links by themselves: https://tidewater.example.com/kayak-clubs and www.example.com.

## Lists

- Paddles
  - Spare paddle, split in two
    - On the back deck, under the bungees
- Pump
- Tow line

1. Check the forecast
2. Check the tides
   1. High water
   2. When the stream turns
3. Tell someone your plan

- [x] Spray deck
- [ ] Flask of tea

## Quotes

> Plan the trip around the tide, not the tide around the trip.
>
> > Unless the café closes at four.
> >
> > > Then plan around the café.

## A table, aligned three ways

| Left | Centre | Right |
| :--- | :---: | ---: |
| Solent | Neap | 1.8 |
| Menai Strait | Spring | 4.25 |
| Bristol Channel | Spring | 12.2 |

## Code

${F}css
.tide-warning {
  border-left: 3px solid var(--warning);
  padding-left: 0.75em;
}
${F}

${F}yaml
region: solent
offline: true
warnings:
  stream_turns: 30m
${F}

${F}diff
- Launch on Friday 4 December
+ Launch on Saturday 5 December
${F}

${F}rust
fn knots(metres_per_second: f64) -> f64 {
    metres_per_second * 1.943_844
}
${F}

## Math

${SINK_MATH}

## A diagram

${F}mermaid
pie title Where the $259 goes
  "Developer account" : 99
  "Demo video" : 120
  "Domain and mail" : 40
${F}

## Footnotes, pictures and long words

Tide times are predictions, not measurements[^tides].

![A small wave over a tide line](/demos/chat/tidewater-icon.svg)

Long words and addresses wrap rather than push the page sideways: tidewater_launch_checklist_final_final_v2_reviewed_by_everyone_and_approved.pdf, and https://tidewater.example.com/releases/2026/12/05/launch-notes-for-everyone-who-signed-up-early-and-confirmed-their-address.html

---

That is everything this chat draws.

[^tides]: The weather moves the water too: a strong wind or high pressure can shift a tide by several minutes and a few centimetres.`;

// 11 -----------------------------------------------------------------------------------------

const SUMMARY = `1. **Launch:** Saturday 5 December, to the waitlist first.
2. **Waitlist:** landing page in week 2, double opt-in, goal 300 by week 4.
3. **Reach:** forums and clubs, no paid ads; $259 in all.
4. **Stores:** submit by 21 November, two weeks of slack.
5. **On the day:** send the email at 9:00, then answer every reply.`;

const SONNET = "anthropic/claude-sonnet-5.5";
const HAIKU = "anthropic/claude-haiku-5.5";

export const CHAT_SHOWCASE: ChatConversation = {
  id: "launch",
  title: "Launch plan for Tidewater",
  model: HAIKU,
  createdAt: at(9, 2),
  updatedAt: at(9, 58),
  demo: true,
  messages: [
    ask("l1", "I'm launching Tidewater, a small tide-times app for sea kayakers, in six weeks. There are two of us and the budget is tiny. Can you help me plan the launch?"),
    answer("l2", SONNET, 3, PLAN, { text: PLAN_THOUGHT, ms: 8200 }),
    ask("l3", "Put the six weeks in a table, with an owner, the hours and a rough cost for each week."),
    answer("l4", HAIKU, 8, WEEKS),
    ask("l5", "We'll start with a waitlist. What's the flow from someone signing up to the launch-day email? Diagrams would help."),
    answer("l6", "openai/gpt-6-luna", 14, FLOW, { text: FLOW_THOUGHT, ms: 6100 }),
    ask("l7", "Write the sign-up endpoint. We use Next.js with Postgres."),
    answer("l8", SONNET, 21, ENDPOINT, { text: ENDPOINT_THOUGHT, ms: 11400 }),
    ask("l9", "If 3% of the people who visit the page sign up, how many sign-ups should we expect from 4,000 visits? And how sure can we be?", { edited: true }),
    answer("l10", "google/gemini-3.8-flash", 27, EXPECT, { text: EXPECT_THOUGHT, ms: 5300 }),
    ask("l11", "Draft the launch-day email. Short, friendly, no exclamation marks."),
    answer("l12", HAIKU, 31, EMAIL),
    ask("l13", "What could go wrong on launch day?"),
    answer("l14", "deepseek/deepseek-v4.1-flash", 36, RISKS, { text: RISKS_THOUGHT, ms: 6800 }),
    ask("l15", "Give me a checklist for the week before, that I can tick off."),
    answer("l16", "qwen/qwen3.8-flash", 40, CHECKLIST),
    ask("l17", "Can you check what the App Store review times are this week?"),
    answer("l18", HAIKU, 43, NO_WEB),
    ask("l19", "Fair enough. Before I write the landing page: show me everything Markdown can do here, so I know what to ask for."),
    answer("l20", SONNET, 50, SINK),
    ask("l21", "Last thing: sum the plan up in five lines I can paste into our team chat."),
    answer("l22", HAIKU, 58, SUMMARY),
  ],
};
