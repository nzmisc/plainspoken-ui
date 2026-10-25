// The editor demo's data: Quire, a team handbook, as Ropewalk Studio (a small design studio) keeps
// it. Invented people, places and addresses. Pictures are small SVGs in public/demos/editor/.
import type { ImageUploadFunction } from "@/registry/plainspoken/ui/rich-text-editor";

export type DocStatus = "draft" | "published";

export interface EditorPerson {
  id: string;
  name: string;
}

export interface EditorDoc {
  id: string;
  title: string;
  status: DocStatus;
  /** The handbook part it is listed under in the sidebar */
  section: string;
  /** ISO date and time of the last save */
  savedAt: string;
  /** Who saved it last */
  savedBy: string;
  /** The text, as Markdown */
  body: string;
}

/** The demo's "now", for the first "saved … ago" (after an edit, the real clock takes over) */
export const EDITOR_NOW = "2026-10-24T15:40:00Z";

export const ME: EditorPerson = { id: "maren", name: "Maren Okafor" };

export const PEOPLE: EditorPerson[] = [
  ME,
  { id: "tobias", name: "Tobias Reyes" },
  { id: "irena", name: "Irena Holm" },
  { id: "kwame", name: "Kwame Asante" },
  { id: "lotte", name: "Lotte de Wit" },
];

export const SECTIONS = ["Start here", "How we work", "The studio", "Reference"];

/** Every element the editor's Markdown knows, on one page */
export const KITCHEN_SINK = `# Markdown kitchen sink

Every element the editor's Markdown knows, on one page, to see how each looks in **Write**, **Markdown** and **Preview**. Change anything in Write and the source is rewritten tidily; switch modes without changing anything and it stays exactly as it is.

## Text

A paragraph with **bold**, *italic*, ***bold italic***, ~~struck out~~ and \`inline code\`. Underscores work too: __bold__ and _italic_. Marks nest: **bold with *italic* and \`code\` inside**.

Line breaks: this line ends with a backslash\\
this one with two spaces
and this one is a plain line end, which joins the paragraph.

Escaped characters stay as they are: \\*not italic\\*, \\_not either\\_, \\# not a heading, 1\\. not a list, \\[not a link\\](nowhere).

Entities: &copy; 2026 Ropewalk Studio &mdash; 5 &times; 3 = 15&hellip; and &lt;angle brackets&gt;.

Raw HTML is shown, never run: <b onclick="alert(1)">this is not bold</b> and <script>alert("no")</script>.

## Links

- An inline link: [the Quire handbook](https://quire.example/handbook)
- With a title: [the style guide](https://quire.example/style "House style, 2026 edition")
- A relative link: [expenses](/handbook/expenses)
- Autolinks: <https://ropewalk.example> and <hello@ropewalk.example>
- A bare web address: https://status.ropewalk.example/today
- A reference link: [the release notes][notes]
- Not allowed, so shown as its text: [a script link](javascript:alert(1))

[notes]: https://quire.example/changelog "Changelog"

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Underlined heading 1
====================

Underlined heading 2
--------------------

## Lists

- Bulleted
- lists
  - nest
    - three levels deep
- and come back.

1. Numbered
2. lists
   1. nest too,
   2. counting on their own
3. and carry on.

7) A list can start
8) at any number, and a different delimiter starts a new list.

- A loose list, with blank lines between its items,

- has a paragraph in each.

  A second paragraph belongs to the same item.

### Tasks

- [x] Write the kitchen sink
- [ ] Check it in every mode
  - [x] Write
  - [ ] Markdown
  - [ ] Preview
- [ ] Ship it
- A plain item among tasks keeps its bullet

## Quotes

> A quote is one or more paragraphs.
>
> > A quote inside a quote.
>
> Quotes hold **any** of the other blocks:
>
> - a list
> - \`code\`
>
> Irena Holm, at the last retro

## Code

\`\`\`ts
// A fenced block with its language
export function wordCount(text: string): number {
  return text.split(/\\s+/).filter(Boolean).length;
}
\`\`\`

~~~
A tilde fence, with no language,
and \`\`\` inside it.
~~~

    An indented block (four spaces)
    is code too.

## Pictures

![A wooden cabin by a lake, with pine trees and hills behind](/demos/editor/cabin.svg "The offsite cabin")

A picture with no alt text is decoration: ![](/demos/editor/process.svg)

## Tables

| Room | Seats | Screen | Booked by |
| :--- | ---: | :---: | --- |
| Loft | 12 | yes | Maren |
| Boiler room | 4 | no | \`nobody\` |
| Garden | 30 | n/a | *ask* Tobias |

## Rules

Three ways to write a rule, all drawn the same:

---

***

___

That's everything.`;

const doc = (d: EditorDoc) => d;

export const DOCS: EditorDoc[] = [
  doc({
    id: "welcome",
    title: "Welcome to Ropewalk",
    status: "published",
    section: "Start here",
    savedAt: "2026-10-21T09:12:00Z",
    savedBy: "maren",
    body: `Hello, and welcome. This handbook is how we work, written down: what to expect, who to ask, and where things are. It's a living document. If something here is wrong or missing, **fix it**; that's what the edit button is for.

![The studio: a long room with a window wall, two desks and a plant](/demos/editor/studio.svg)

## Who we are

Ropewalk is eleven people who design and build software for libraries, museums and the odd ferry company. We work in the old rope works on Ropewalk Lane, three days a week together and the rest wherever suits.

## Your first week

- [x] Get your laptop and keys from Lotte
- [ ] Set up your laptop (see [Setting up your laptop](#laptop))
- [ ] Lunch with your buddy on Wednesday
- [ ] Read [How we run a project](#process)
- [ ] Ask at least three questions in #studio

> There are no silly questions in your first month. After that there still aren't, but we stop counting.

If you get stuck, ask **Maren** (people and money) or **Tobias** (projects and tools).`,
  }),
  doc({
    id: "hours",
    title: "Hours, holidays and sick days",
    status: "published",
    section: "Start here",
    savedAt: "2026-10-02T14:30:00Z",
    savedBy: "maren",
    body: `## Hours

We work a 36-hour week. Core hours are **10:00 to 15:00** on studio days; outside those, plan your day as you like.

| Day | In the studio | Notes |
| --- | :---: | --- |
| Monday | yes | Planning at 10:00 |
| Tuesday | no | Deep work, meetings only if urgent |
| Wednesday | yes | Lunch together |
| Thursday | yes | Demos at 16:00 |
| Friday | no | Finish at 15:00 |

## Holidays

You get **28 days** a year plus public holidays. Book them in the calendar and tell your project lead; anything over two weeks, a month ahead please.

## Sick days

Stay home and rest. Post a short note in #studio before 10:00 so we can move meetings; no doctor's note needed for the first five days.`,
  }),
  doc({
    id: "process",
    title: "How we run a project",
    status: "published",
    section: "How we work",
    savedAt: "2026-09-18T11:05:00Z",
    savedBy: "tobias",
    body: `Every project goes round the same loop, however big it is:

![Our process: listen, sketch, build, review, and back to listen](/demos/editor/process.svg)

1. **Listen.** Talk to the people who will use it, not only the people who pay for it.
2. **Sketch.** Paper first, then clickable sketches. Nothing is precious yet.
3. **Build.** Small pieces, shipped to a test site every day.
4. **Review.** Every Thursday at 16:00 we show what changed, to the client and to each other.

Then round again, until it is done or the money is.

## Estimates

We estimate in weeks, never in hours, and we give a range: *"three to five weeks"*. If the range is wider than double, we don't know enough yet and we say so.

> A project is late when we stop telling the client how it's going, not when it takes longer than we thought.`,
  }),
  doc({
    id: "laptop",
    title: "Setting up your laptop",
    status: "published",
    section: "How we work",
    savedAt: "2026-10-23T16:48:00Z",
    savedBy: "kwame",
    body: `Your laptop comes with the operating system and nothing else. This gets you to a working setup in about an hour.

## Accounts

- [ ] Password manager: you'll get an invite to the *Ropewalk* vault
- [ ] Email and calendar
- [ ] The code host, with two-factor sign-in on

## Tools

Install the command line tools, then the studio's setup script:

\`\`\`sh
xcode-select --install
curl -fsSL https://setup.ropewalk.example/install.sh | sh
\`\`\`

The script installs \`git\`, \`node\` and our editor settings, and asks for your name. Check that it worked:

\`\`\`sh
node --version   # v24 or newer
git config user.name
\`\`\`

## When it goes wrong

Ask in #tools. Paste the **whole** error, not a screenshot of the last line.`,
  }),
  doc({
    id: "style",
    title: "Writing style",
    status: "draft",
    section: "How we work",
    savedAt: "2026-10-24T13:20:00Z",
    savedBy: "irena",
    body: `How we write for clients, for the web, and for each other. Short version: **plain words, short sentences, the point first.**

## Words

- Write *use*, not ~~utilise~~; *help*, not ~~facilitate~~
- Name things the way the reader does, not the way the database does: "your bookings", not \`booking_records\`
- Numbers as digits: 3 people, 10 minutes

## Headings

Headings say what the section says. "Book a room" beats "Room booking functionality".

## To do before this is published

- [ ] Examples from the museum project
- [ ] A section on error messages
- [ ] Ask Kwame about the word "deploy"`,
  }),
  doc({
    id: "office",
    title: "Getting to the studio",
    status: "published",
    section: "The studio",
    savedAt: "2026-08-30T10:00:00Z",
    savedBy: "lotte",
    body: `We're at **4 Ropewalk Lane**, on the first floor of the old rope works, two streets from Harbour Station.

![Map: the studio at 4 Ropewalk Lane, two streets from Harbour Station](/demos/editor/map.svg)

## By train

From Harbour Station, take the Quay Road exit, turn left at the bakery, and it's the long brick building on your right. Five minutes on foot.

## By bike

There are covered racks in the yard. The gate code is in the password vault under *Studio gate*.

## Keys and alarm

Lotte has the keys. The last one out sets the alarm: the panel is by the door, and the code is in the vault too.`,
  }),
  doc({
    id: "offsite",
    title: "Autumn offsite: plan",
    status: "draft",
    section: "The studio",
    savedAt: "2026-10-24T15:31:00Z",
    savedBy: "maren",
    body: `Two days at the lake cabin in **November**, all of us. Partners and dogs welcome on the second evening.

![A wooden cabin by a lake, with pine trees and hills behind](/demos/editor/cabin.svg)

## Schedule

| When | What | Who leads |
| --- | --- | --- |
| Thu 10:00 | Train from Harbour Station | Lotte |
| Thu 14:00 | The year so far | Maren |
| Thu 19:00 | Dinner | everyone |
| Fri 10:00 | Next year's projects | Tobias |
| Fri 15:00 | Walk round the lake | nobody |

## Still to do

- [x] Book the cabin
- [ ] Book the train (14 seats)
- [ ] Ask about dietary needs
- [ ] Find someone who can cook for fourteen`,
  }),
  doc({
    id: "expenses",
    title: "Expenses",
    status: "published",
    section: "Reference",
    savedAt: "2026-07-14T09:40:00Z",
    savedBy: "maren",
    body: `If you paid for something for work, you get it back within the month.

1. Keep the receipt (a photo is fine)
2. Add it to the expenses sheet by the **25th**
3. It's paid with your salary

## What counts

| Item | Limit | Ask first? |
| --- | ---: | :---: |
| Train and bus | none | no |
| Books | 150 a year | no |
| A conference | 900 a year | yes |
| Lunch with a client | 40 a head | no |

Anything else, ask Maren before you buy it. Questions go to <money@ropewalk.example>.`,
  }),
  doc({
    id: "kitchen-sink",
    title: "Markdown kitchen sink",
    status: "draft",
    section: "Reference",
    savedAt: "2026-10-24T12:00:00Z",
    savedBy: "kwame",
    body: KITCHEN_SINK,
  }),
];

export const personName = (id: string) => PEOPLE.find((p) => p.id === id)?.name ?? "Someone";

/**
 * Stands in for the server: "uploads" in about two seconds with progress, then resolves with a
 * local object URL for the file. A real one would send it and resolve with where it was stored.
 * A file with "fail" in its name fails halfway, to show the error.
 */
export const fakeImageUpload: ImageUploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      done = Math.min(1, done + 0.08 + Math.random() * 0.06);
      onProgress(done);
      if (/fail/i.test(file.name) && done > 0.5) {
        clearInterval(timer);
        reject(new Error("the storage server didn't answer"));
      } else if (done >= 1) {
        clearInterval(timer);
        resolve(URL.createObjectURL(file));
      }
    }, 160);
    signal.addEventListener("abort", () => clearInterval(timer));
  });
