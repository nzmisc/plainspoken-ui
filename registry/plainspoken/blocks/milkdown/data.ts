import type { ImageUploadFunction } from "@/registry/plainspoken/ui/milkdown-editor";
import { BookOpen, File, FileCode, TriangleAlert, Users, type Glyph } from "@/registry/plainspoken/lib/icons";

// The engineering notebook of Pennant, an invented company that makes the ticketing for regional
// buses: card validators on the buses, ticket machines, an app and the back office behind them.
// Everyone and everything here is made up.

export type PageKind = "start" | "rfc" | "runbook" | "incident" | "notes" | "plan" | "reference" | "page";
export type PageStatus = "draft" | "review" | "published" | "outdated";

export interface Person {
  name: string;
  role: string;
}

export interface NotebookPage {
  id: string;
  title: string;
  kind: PageKind;
  /** Key of a section in SECTIONS */
  section: string;
  /** A folder inside the section ("Runbooks"), or straight in the section */
  folder?: string;
  status: PageStatus;
  /** Keys in PEOPLE, first author first */
  authors: string[];
  /** ISO time of the last change */
  editedAt: string;
  editedBy: string;
  /** The page, in Markdown (the title is not part of it) */
  body: string;
}

export interface NotebookSection {
  key: string;
  /** Small heading over the section in the page tree; none for the top group */
  heading?: string;
}

export interface PageTemplate {
  key: string;
  label: string;
  hint: string;
  icon: Glyph;
  kind: PageKind;
  /** Where a page made from it goes; leave out for the section of the page that is open */
  section?: string;
  folder?: string;
  body: string;
}

export const PEOPLE: Record<string, Person> = {
  sofia: { name: "Sofia Lindgren", role: "Staff engineer, payments" },
  tomasz: { name: "Tomasz Wójcik", role: "Site reliability" },
  hana: { name: "Hana Sato", role: "Validator firmware" },
  daniel: { name: "Daniel Okoye", role: "Engineering manager" },
  felix: { name: "Felix Brandt", role: "Back office and settlement" },
  leila: { name: "Leila Haddad", role: "Data and capacity" },
};

/** Who is using the notebook: their edits read "by you" */
export const ME = "sofia";

/** The moment the demo pages were last edited from: their "edited … ago" counts from here */
export const NOTEBOOK_NOW = "2026-10-23T15:40:00Z";

export const SECTIONS: NotebookSection[] = [
  { key: "start" },
  { key: "rfcs", heading: "RFCs" },
  { key: "operations", heading: "Operations" },
  { key: "incidents", heading: "Incident reviews" },
  { key: "meetings", heading: "Meetings" },
  { key: "planning", heading: "Planning" },
  { key: "reference", heading: "Reference" },
];

export const STATUSES: { value: PageStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "outdated", label: "Outdated" },
];

/** Every element CommonMark and GFM have, with math and footnotes: the round-trip test */
export const KITCHEN_SINK = `# Every Markdown element

A paragraph with **bold**, *italic*, ***both***, ~~struck out~~, \`inline code\` and a [link with a title](https://example.com/guide "The guide"). A line can end with a hard break\\
and carry on below it. Characters that mean something in Markdown can be escaped: \\*not italic\\*, 5 \\* 3, \\# not a heading.

## Headings

### Third level

#### Fourth level

##### Fifth level

###### Sixth level

## Lists

- Bullets, one level
- With a second level:
  - Nested item
  - Another, with \`code\`
- Back at the first

1. Numbered
2. In order
3. Third

A numbered list can start anywhere:

7. Seventh
8. Eighth

- [x] A task that is done
- [ ] A task still to do
- A plain item in the same list

## Quotes

> A quote, with **formatting** inside.
>
> > And a quote within the quote.

## Code

\`\`\`ts
export function greet(name: string): string {
  return \`Hello, \${name}\`;
}
\`\`\`

\`\`\`
Plain text in a code block, no language.
\`\`\`

## A table

| Plan | Seats | Price | Note |
| :--- | ---: | :---: | --- |
| Starter | 3 | €9 | For trying it out |
| Team | 25 | €49 | **Most chosen** |
| Company | 250 | €290 | With single sign-on |

## Pictures

![The depot from the street, with a cargo bike outside](/demos/milkdown/depot.svg "A title for the picture")

## Math

The area of a circle is $A = \\pi r^2$, and the quadratic formula is:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Footnotes

Markdown has footnotes too.[^1] They gather at the end.[^note]

[^1]: The first footnote.

[^note]: A footnote with a name rather than a number.

---

Raw HTML such as <kbd>Ctrl</kbd> is kept, shown as text. A web address on its own: https://example.com/start`;

/** The pages a new visitor sees, and what Reset brings back */
export const PAGES: NotebookPage[] = [
  {
    id: "start",
    title: "Start here",
    kind: "start",
    section: "start",
    status: "published",
    authors: ["daniel", "sofia"],
    editedAt: "2026-09-30T10:05:00Z",
    editedBy: "daniel",
    body: `Welcome to the Pennant engineering notebook. It holds what we decide (RFCs), what we do when things break (runbooks and incident reviews), and the week-to-week notes of on-call. If you joined this month, read these first:

1. [RFC-0042: Idempotency keys for top-ups](#rfc-0042), which most of the payments code follows
2. [Validator latency](#validator-latency), the runbook you'll open most on call
3. [Rota and escalation](#rota), so you know who to wake

## How we write here

- **Short pages, plain words.** A page answers one question and links to the rest.
- **Decisions are RFCs.** Start one from *New page*, ask for review in #eng-rfcs, and mark it *Published* once two people from the team that owns the code agree.
- **Runbooks are tested.** Whoever uses a runbook on call fixes what was wrong in it the same day.

## Writing in the notebook

Pages are Markdown underneath, so whatever you paste from a README or a terminal keeps its shape.

| To | Do this |
| --- | --- |
| Add a heading, list, table, code or math | Type / at the start of a line |
| Move a paragraph or a table | Drag the handle left of it, or open its menu |
| Make words bold or a link | Select them |
| See or edit the Markdown | Markdown, at the top right of the editor |

Pages are saved in this browser as you type.`,
  },
  {
    id: "rfc-0042",
    title: "RFC-0042: Idempotency keys for top-ups",
    kind: "rfc",
    section: "rfcs",
    status: "published",
    authors: ["sofia", "felix"],
    editedAt: "2026-10-20T09:12:00Z",
    editedBy: "felix",
    body: `**Status:** accepted on 2 September 2026 · **Owners:** Payments · **Replaces:** RFC-0031

## Summary

Every request that moves money (a top-up, a refund, a fare adjustment) carries an \`Idempotency-Key\` header. The API stores the first response for each key for 24 hours and returns it again for any retry, so a rider who taps *Pay* twice on a bad connection is charged once.

## Motivation

In August, 0.4% of top-ups from the app were retried by the client after a timeout, and 31 riders were charged twice.[^august] Support refunded each one by hand. The validators already ignore a second tap of the same card within a few seconds; the API has nothing like it.

## Design

The client makes the key once per thing the rider does, not once per HTTP attempt:

\`\`\`ts
const key = crypto.randomUUID();
await retry(() =>
  api.post("/v2/top-ups", { amount, cardId }, { headers: { "Idempotency-Key": key } }),
);
\`\`\`

The API keeps keys in Postgres next to the ledger, so the stored response and the money commit together:

\`\`\`sql
create table idempotency_keys (
  key        uuid primary key,
  account_id bigint not null references accounts,
  request    bytea not null, -- hash of method, path and body
  response   jsonb,
  created_at timestamptz not null default now()
);
\`\`\`

| Case | What the API does | Status |
| --- | --- | ---: |
| New key | Runs the request and stores the response | 201 |
| Same key, same request, finished | Returns the stored response | 201 |
| Same key, same request, still running | Asks the client to wait and retry | 409 |
| Same key, different request | Refuses: the key was reused | 422 |

Keys expire after 24 hours, and a nightly job deletes them in batches of 10,000.[^batches]

## Alternatives

- **Ignore the same amount on the same card within a minute.** Simple, but two real top-ups of €10 a minute apart do happen (parents topping up a child's card), and we'd refuse the second.
- **Make the client ask before retrying.** Doubles the requests on the path that is already slow.

## Rollout

- [x] API accepts and stores keys (v2.18)
- [x] iOS and Android apps send them (6.4)
- [ ] Ticket machines send them (firmware 3.2, with Hana)
- [ ] Refuse money-moving requests without a key, not before January

[^august]: From the support log, 1 to 31 August 2026. The query is on the payments dashboard.

[^batches]: Small batches keep the table from locking during the evening peak.`,
  },
  {
    id: "rfc-0045",
    title: "RFC-0045: Fare caps on offline validators",
    kind: "rfc",
    section: "rfcs",
    status: "review",
    authors: ["hana", "leila"],
    editedAt: "2026-10-23T11:02:00Z",
    editedBy: "hana",
    body: `**Status:** in review until 31 October · **Owners:** Validators, Fares

## Summary

A rider who travels more than the daily cap's worth pays the cap and no more, even on buses whose validators are offline all day. Today the cap is applied only once the taps reach the back office, so riders on the rural routes are charged in full and refunded up to three days later.

## How the cap works today

For a rider with taps $t_1, \\dots, t_n$ in a service day, the charge is $\\min\\left(\\sum_i f(t_i),\\ C\\right)$, where $f$ is the fare of a tap and $C$ the cap for the zones travelled. The back office works it out overnight.

## Proposal

Each validator keeps a running total on the card itself, signed with the validator's key:

| Field | Bytes | Example |
| --- | ---: | --- |
| Service day | 2 | 2026-10-23 |
| Total so far, in cents | 3 | 840 |
| Zones touched | 1 | 1 and 2 |
| Signature | 16 | |

When the total reaches the cap, the validator lets the rider through without charging and shows **Capped today**.

> The card is the only thing every validator on a route sees. Keeping the total on it means two offline buses agree without talking to each other.

## Open questions

- [ ] What happens when a rider taps on a validator with older firmware? (Hana)
- [ ] Is there room on the card for a second total, for the weekly cap? (Leila)
- [ ] Can riders see their running total in the app before the taps sync?`,
  },
  {
    id: "validator-latency",
    title: "Validator latency",
    kind: "runbook",
    section: "operations",
    folder: "Runbooks",
    status: "published",
    authors: ["tomasz", "hana"],
    editedAt: "2026-10-22T16:48:00Z",
    editedBy: "tomasz",
    body: `Use this when the **Validator tap latency** alert fires: the time from tap to green light is above 600 ms at the 95th percentile on a route for 5 minutes. Riders notice at about 800 ms, and above 1.5 s queues form at the front door.

## Check how bad it is

| Signal | Where | Normal | Act at |
| --- | --- | ---: | ---: |
| Tap to light, p95 | Grafana, *Validators* | 280 ms | 600 ms |
| Validators offline | Fleet console | 0–3 | 10 |
| Taps waiting to sync, per bus | Fleet console, *Bus*, *Queue* | 50 | 500 |
| Card API errors | Grafana, *Card API* | 0.1% | 1% |

If only one bus is slow, it's the bus: go to the last step. If a whole route or depot is slow, it's the network or the card API.

## A whole route is slow

Check the mobile network first. The validators fall back to offline mode when the API can't be reached, but only after three slow taps.

\`\`\`bash
# Round trip from one validator on the route, through the bus's router
pennant-fleet exec --route 7 --one -- ping -c 20 api.pennant.example

# Taps waiting to sync, busiest buses first
pennant-fleet queue --route 7 --sort desc | head
\`\`\`

If the card API is the slow part, look for long queries:

\`\`\`sql
select pid, now() - query_start as running, left(query, 80)
from pg_stat_activity
where state = 'active' and now() - query_start > interval '2 seconds'
order by running desc;
\`\`\`

## One bus is slow

1. Ask the driver over the radio whether the validator shows **Offline**.
2. Restart the validator from the fleet console (*Bus*, *Validator*, *Restart*). It takes 40 seconds and refuses taps meanwhile, so wait for a quiet stop.
3. If it comes back slow, mark the bus *Validator faulty* so the depot swaps the unit overnight.

## Before you close the alert

- [ ] Tap to light under 400 ms for 15 minutes
- [ ] Sync queues going down on every bus on the route
- [ ] What you did, and when, in the on-call handover
- [ ] Anything wrong in this runbook fixed

Call the validator team (see [Rota and escalation](#rota)) if latency is still above 600 ms after 30 minutes.`,
  },
  {
    id: "settlement-rejected",
    title: "Settlement file rejected",
    kind: "runbook",
    section: "operations",
    folder: "Runbooks",
    status: "draft",
    authors: ["felix"],
    editedAt: "2026-10-23T08:30:00Z",
    editedBy: "felix",
    body: `The bank rejects the nightly settlement file about once a quarter. Riders' top-ups are fine when it does, but the bus operators aren't paid until we send a corrected file, and the bank's cut-off is **10:00** the next working day.

## Find out why

The rejection arrives by email at settlement@pennant.example, with a reason code:

| Code | Means | Usual cause |
| --- | --- | --- |
| \`R02\` | Totals don't match | A refund booked after the file was cut |
| \`R07\` | Duplicate file | The job ran twice |
| \`R11\` | Unknown account | An operator changed bank details |

## Make a new file

\`\`\`bash
pennant-settle rebuild --date 2026-10-22 --dry-run
pennant-settle rebuild --date 2026-10-22 --send
\`\`\`

The dry run prints the total per operator. Check them against the ledger before you send.

*Still to write: the steps for R11, which need someone from finance.*`,
  },
  {
    id: "oncall-handover-43",
    title: "Handover, week 43",
    kind: "notes",
    section: "operations",
    folder: "On-call",
    status: "draft",
    authors: ["tomasz"],
    editedAt: "2026-10-23T15:12:00Z",
    editedBy: "tomasz",
    body: `**From** Tomasz Wójcik **to** Sofia Lindgren, who is on call from Monday 26 October.

## Still open

- [ ] Bus 7-114's validator drops to offline every afternoon. The depot swaps the unit on Tuesday night; until then, its alerts can wait.
- [ ] The settlement file for 22 October went out late (R02, see [Settlement file rejected](#settlement-rejected)). The bank has it now; check on Friday that the operators were paid.
- [ ] Card API p99 jumps at 02:00 every night for about 4 minutes. Probably the key clean-up from [RFC-0042](#rfc-0042); not urgent.

## Done this week

- [x] Restarted the validators on route 12 after the router update (Tuesday)
- [x] Topped up the test cards for the bundle checks
- [x] Fixed the latency runbook: the \`pennant-fleet queue\` flags had changed

## Coming up

- Firmware 3.2 goes to the ticket machines at Millbrook depot on **Tuesday 27 October**. Hana will be on the depot floor; expect a few machines to restart.
- Hana is away on Thursday and Friday, so Felix is secondary for those two days.`,
  },
  {
    id: "rota",
    title: "Rota and escalation",
    kind: "reference",
    section: "operations",
    folder: "On-call",
    status: "published",
    authors: ["daniel"],
    editedAt: "2026-10-12T09:00:00Z",
    editedBy: "daniel",
    body: `On call means answering pages within 10 minutes, day and night, for a week from Monday 09:00. Swap weeks with anyone on the rota, and tell Daniel when you do.

## The next four weeks

| Week | From | Primary | Secondary |
| ---: | --- | --- | --- |
| 43 | 19 October | Tomasz Wójcik | Felix Brandt |
| 44 | 26 October | Sofia Lindgren | Hana Sato |
| 45 | 2 November | Felix Brandt | Tomasz Wójcik |
| 46 | 9 November | Hana Sato | Sofia Lindgren |

## Who to call

| Problem | First | Then | After 30 minutes |
| --- | --- | --- | --- |
| Validators, card readers, firmware | Primary | Hana Sato | Daniel Okoye |
| Card API, the app, top-ups | Primary | Sofia Lindgren | Daniel Okoye |
| Settlement and bank files | Primary | Felix Brandt | Finance duty phone |
| Networks on the buses | Fleet desk | The operator's depot | Daniel Okoye |

Pages go out through the pager app. If the pager app is down, the fleet desk phones you. Phone numbers are in the pager app, not here.

## Pay

On call pays €250 a week, and an hour off for every page you answer between 22:00 and 07:00.`,
  },
  {
    id: "route-7-taps",
    title: "Route 7 tap failures, 14 October",
    kind: "incident",
    section: "incidents",
    status: "published",
    authors: ["tomasz", "daniel"],
    editedAt: "2026-10-17T14:20:00Z",
    editedBy: "daniel",
    body: `**Severity:** 2 · **Lasted:** 1 h 52 min · **Riders affected:** about 1,900

## Summary

From 07:12 to 09:04 on Wednesday 14 October, the validators on route 7 refused about 30% of contactless bank cards with *Card not accepted*. Pennant cards worked. Drivers waved most riders on, so little fare was lost (about €1,150), but the morning peak ran up to 11 minutes late.

![Route 7, from Millbrook depot to Ashford Cross](/demos/milkdown/route-7.svg)

## Timeline

| Time | What happened |
| --- | --- |
| 06:40 | Certificate bundle 2026.10.2 sent to the route 7 validators in the overnight window |
| 07:12 | First refused taps; refusals of contactless cards climb to 30% |
| 07:31 | The *Contactless refusals* alert fires and Tomasz picks it up |
| 07:58 | The refused cards all come from one card acquirer; the payment provider sees nothing wrong |
| 08:40 | Hana notices that the refusals began right after the new bundle |
| 08:51 | Bundle 2026.10.1 sent back to the route |
| 09:04 | Refusals back to normal (0.6%) |

## What went wrong

The new bundle left out an intermediate certificate that one acquirer still uses. Our checks tap the three test cards we have, and none of them goes through that certificate.

> We changed something on every validator on a route at once, and our only check was that nothing failed at the depot.

## What went well

- Going back to the old bundle took 11 minutes from deciding to do it.
- Drivers already knew to let riders on when a validator refuses a card that should work.

## Actions

- [x] Send bundle 2026.10.1 back to route 7 (Hana, 14 October)
- [ ] Check each bundle against the acquirers' published chains before release (Hana, 31 October)
- [ ] Send bundles to one bus first, then one route, then the fleet (Tomasz, 7 November)
- [ ] Alert on refusals per acquirer, not only in total (Felix, 14 November)`,
  },
  {
    id: "platform-weekly-1021",
    title: "Platform weekly, 21 October",
    kind: "notes",
    section: "meetings",
    status: "published",
    authors: ["felix"],
    editedAt: "2026-10-21T12:40:00Z",
    editedBy: "felix",
    body: `**Present:** Daniel, Sofia, Tomasz, Hana, Felix, Leila · **Notes:** Felix

## Bundle releases after route 7

Tomasz proposed sending certificate bundles to one bus, then one route, then the fleet, a day apart. Hana worried that makes urgent fixes slow. Agreed: a bundle marked *urgent* can skip the one-bus day, with Daniel's say-so.

## Idempotency keys on ticket machines

Firmware 3.2 is in testing at Millbrook depot. Two machines sent the same key for different top-ups after a restart. Hana thinks the random number generator isn't seeded yet when the machine starts; to be fixed before release.

## Capacity

Leila has the first numbers for 2027, in [Capacity plan 2027](#capacity-2027). One more API instance; she'll take it to finance.

## Actions

- [ ] Write the staged release into the release checklist (Tomasz)
- [ ] Seed the random number generator from the secure element at start-up (Hana)
- [ ] Book the capacity review with finance (Leila)
- [x] Send the route 7 review to the operators (Daniel)`,
  },
  {
    id: "capacity-2027",
    title: "Capacity plan 2027",
    kind: "plan",
    section: "planning",
    status: "review",
    authors: ["leila", "felix"],
    editedAt: "2026-10-19T13:25:00Z",
    editedBy: "leila",
    body: `How many taps a second the card API must take at the 2027 peak, and what that costs. The numbers are from the October 2026 traffic report; the model is simple on purpose.

## Taps at the peak

We model the morning peak from the buses in service $B$, the boardings per bus per hour $b$, and the share $s$ of riders paying with a bank card (those taps go to the API; Pennant cards don't):

$$
\\lambda = \\frac{B \\cdot b \\cdot s}{3600}
$$

| | 2026 | 2027 |
| --- | ---: | ---: |
| Buses at the peak, $B$ | 1,240 | 1,410 |
| Boardings per bus per hour, $b$ | 38 | 40 |
| Share paying by bank card, $s$ | 0.46 | 0.58 |
| Taps a second, $\\lambda$ | 6.0 | 9.1 |

Taps aren't spread evenly: they bunch at stops. We size for the busiest second, about $k = 8$ times the average, so in 2027 the API must take $k\\lambda \\approx 73$ taps a second.

## Servers

One API instance handles $\\mu = 25$ taps a second within our latency target. With a spare instance in each of the two zones:

$$
n = \\left\\lceil \\frac{k\\lambda}{\\mu} \\right\\rceil + 2 = \\left\\lceil \\frac{73}{25} \\right\\rceil + 2 = 5
$$

That is one instance more than today, about €310 a month.

## To check

- [ ] Will the bank-card share really reach 0.58 once the new tickets launch? (Leila, with the fares team)
- [ ] The peak factor $k$ from this year's tap logs, rather than the 2025 study`,
  },
  {
    id: "every-element",
    title: "Every Markdown element",
    kind: "reference",
    section: "reference",
    status: "published",
    authors: ["sofia"],
    editedAt: "2026-10-01T08:00:00Z",
    editedBy: "sofia",
    // The page title stands in for the first heading
    body: KITCHEN_SINK.replace(/^# .*\n+/, ""),
  },
];

export const DEFAULT_PAGE = "rfc-0042";

/** What New page offers */
export const TEMPLATES: PageTemplate[] = [
  {
    key: "blank",
    label: "Blank page",
    hint: "An empty page, next to the one that is open",
    icon: File,
    kind: "page",
    body: ``,
  },
  {
    key: "rfc",
    label: "RFC",
    hint: "Propose a change and ask for review",
    icon: FileCode,
    kind: "rfc",
    section: "rfcs",
    body: `**Status:** draft · **Owners:** your team

## Summary

*One paragraph: what changes, and for whom.*

## Motivation

*What goes wrong today, with numbers if you have them.*

## Design

*How it works. Code, tables and diagrams welcome.*

## Alternatives

*What else you considered, and why not.*

## Rollout

- [ ] First step`,
  },
  {
    key: "runbook",
    label: "Runbook",
    hint: "What to do when an alert fires",
    icon: BookOpen,
    kind: "runbook",
    section: "operations",
    folder: "Runbooks",
    body: `Use this when *the alert that fires, or what someone reports*.

## Check how bad it is

| Signal | Where | Normal | Act at |
| --- | --- | ---: | ---: |
| *Signal* | *Dashboard* | | |

## Fix it

1. *First step*

## Before you close the alert

- [ ] Back to normal for 15 minutes
- [ ] What you did, and when, in the on-call handover`,
  },
  {
    key: "incident",
    label: "Incident review",
    hint: "What happened, and what we'll change",
    icon: TriangleAlert,
    kind: "incident",
    section: "incidents",
    body: `**Severity:** · **Lasted:** · **Riders affected:**

## Summary

*What riders saw, for how long, and what it cost.*

## Timeline

| Time | What happened |
| --- | --- |
| 00:00 | *First sign of trouble* |

## What went wrong

## What went well

## Actions

- [ ] *Action (owner, date)*`,
  },
  {
    key: "meeting",
    label: "Meeting notes",
    hint: "Who came, what was decided, who does what",
    icon: Users,
    kind: "notes",
    section: "meetings",
    body: `**Present:** · **Notes:**

## First topic

## Actions

- [ ] *Action (owner)*`,
  },
];

/**
 * A pretend upload: a few seconds of progress, then the picture as an object URL (so it lasts
 * until the page is reloaded; there is no server). A file with "fail" in its name fails.
 */
export const fakeUpload: ImageUploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      done = Math.min(1, done + 0.125);
      onProgress(done);
      if (done < 1) return;
      clearInterval(timer);
      if (/fail/i.test(file.name)) reject(new Error("the file server refused it"));
      else resolve(URL.createObjectURL(file));
    }, 250);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(new DOMException("Canceled", "AbortError"));
    });
  });
