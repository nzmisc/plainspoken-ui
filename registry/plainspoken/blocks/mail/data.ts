// The demo mailbox: Nora Lindqvist's mail at Fernhill Studio, a small design studio in Malmö,
// on a Saturday morning (2026-10-24). Fictional people and companies. Times are wall-clock times
// ("2026-10-24T09:41") with no time zone, so they read the same on the server and in any browser.

/** Where a conversation lives. Starred and labels are views across folders, not folders. */
export type FolderId = "inbox" | "snoozed" | "sent" | "drafts" | "archive" | "spam" | "trash";

export type LabelId = "clients" | "invoices" | "studio" | "travel" | "family";

/** What the list shows: a folder, everything starred, or everything with a label */
export type MailView = FolderId | "starred" | `label:${LabelId}`;

export interface Person {
  name: string;
  email: string;
  /** A company or a mailing list rather than a person: shown by its whole name */
  org?: boolean;
  /** Job and company, for the contact card: "Marketing lead, Kestrel Outdoor" */
  role?: string;
}

export type AttachmentKind = "pdf" | "image" | "sheet" | "doc" | "zip";

export interface Attachment {
  name: string;
  /** Bytes */
  size: number;
  kind: AttachmentKind;
}

export interface MailMessage {
  id: string;
  from: Person;
  to: Person[];
  cc?: Person[];
  /** "2026-10-24T09:41", local wall-clock time */
  date: string;
  /** Plain text; paragraphs are separated by a blank line */
  body: string;
  attachments?: Attachment[];
}

export interface MailThread {
  id: string;
  folder: FolderId;
  subject: string;
  /** Oldest first */
  messages: MailMessage[];
  unread: boolean;
  starred: boolean;
  labels: LabelId[];
  /** Folder "snoozed": when it comes back to the inbox */
  snoozedUntil?: string;
}

/** What a reply box or the compose dialog hands over when sending or saving */
export interface MailDraft {
  /** Set when editing a saved draft: the draft conversation's id */
  id?: string;
  to: Person[];
  cc: Person[];
  subject: string;
  body: string;
  attachments: Attachment[];
}

export interface MailFolder {
  id: FolderId;
  label: string;
}

export interface MailLabel {
  id: LabelId;
  label: string;
  /** A chart colour token, for the square next to the label */
  color: string;
}

/** "Today" in the demo, and the moment it is: Saturday morning */
export const MAIL_TODAY = "2026-10-24";
export const MAIL_NOW = "2026-10-24T09:50";

export const ME: Person = { name: "Nora Lindqvist", email: "nora@fernhill.studio" };

export const FOLDERS: MailFolder[] = [
  { id: "inbox", label: "Inbox" },
  { id: "snoozed", label: "Snoozed" },
  { id: "sent", label: "Sent" },
  { id: "drafts", label: "Drafts" },
  { id: "archive", label: "Archive" },
  { id: "spam", label: "Spam" },
  { id: "trash", label: "Trash" },
];

export const LABELS: MailLabel[] = [
  { id: "clients", label: "Clients", color: "var(--chart-1)" },
  { id: "invoices", label: "Invoices", color: "var(--chart-2)" },
  { id: "studio", label: "Studio", color: "var(--chart-3)" },
  { id: "travel", label: "Travel", color: "var(--chart-4)" },
  { id: "family", label: "Family", color: "var(--chart-5)" },
];

// People ------------------------------------------------------------------------------------------

const P = {
  tomas: { name: "Tomás Ruiz", email: "tomas@fernhill.studio", role: "Designer, Fernhill Studio" },
  lena: { name: "Lena Fischer", email: "lena@fernhill.studio", role: "Studio manager, Fernhill Studio" },
  marta: { name: "Marta Kowalska", email: "marta.kowalska@kestrel-outdoor.example", role: "Marketing lead, Kestrel Outdoor" },
  daniel: { name: "Daniel Osei", email: "daniel@harbourprint.example", role: "Account manager, Harbour Print Co." },
  priya: { name: "Priya Raman", email: "priya.raman@lumendental.example", role: "Practice manager, Lumen Dental Group" },
  hugo: { name: "Hugo Bernard", email: "h.bernard@oakridgelibrary.example", role: "Communications, Oakridge Library" },
  ruth: { name: "Ruth Adeyemi", email: "ruth@adeyemi-accounts.example", role: "Accountant, Adeyemi & Co." },
  mum: { name: "Birgitta Lindqvist", email: "birgitta.lindqvist@telia.example", role: "Family" },
  felix: { name: "Felix Lindqvist", email: "felix.lindqvist@posteo.example", role: "Family" },
  aiko: { name: "Aiko Tanaka", email: "aiko@tanakatea.example", role: "Owner, Tanaka Tea House" },
  sven: { name: "Sven Ahlgren", email: "sven.ahlgren@ahlgrenfastigheter.example", role: "Property manager, Ahlgren Fastigheter" },
  wen: { name: "Wen Li", email: "wenli.design@mailbox.example", role: "Design student" },
  joanna: { name: "Joanna Mbeki", email: "joanna.mbeki@malmoarts.example", role: "Programme lead, Malmö School of Arts" },
  rail: { name: "Northline Rail", email: "tickets@northline-rail.example", org: true },
  cloudnest: { name: "Cloudnest Billing", email: "billing@cloudnest.example", org: true },
  kerning: { name: "The Kerning Post", email: "letters@kerningpost.example", org: true },
  nddays: { name: "Nordic Design Days", email: "speakers@nordicdesigndays.example", org: true },
  halvard: { name: "Halvard Insurance", email: "no-reply@halvard-insurance.example", org: true },
  dentist: { name: "Söder Dental Clinic", email: "bookings@soderdental.example", org: true },
  pixel: { name: "PixelVault", email: "deals@pixelvault.example", org: true },
  prize: { name: "Prize Desk", email: "winner-notice@prize-desk.example", org: true },
  accounts: { name: "Accounts Department", email: "accounts@secure-invoice-portal.example", org: true },
  growth: { name: "Growth Hacker Pro", email: "hello@growthhackerpro.example", org: true },
} satisfies Record<string, Person>;

/** People you can write to: the compose box suggests these */
export const CONTACTS: Person[] = [P.tomas, P.lena, P.marta, P.daniel, P.priya, P.hugo, P.ruth, P.mum, P.felix, P.aiko, P.sven, P.wen, P.joanna];

// Conversations -----------------------------------------------------------------------------------

const KB = 1024;
const MB = 1024 * 1024;

export const THREADS: MailThread[] = [
  // Inbox
  {
    id: "catalogue",
    folder: "inbox",
    subject: "Spring catalogue: proofs for review",
    unread: true,
    starred: true,
    labels: ["clients"],
    messages: [
      {
        id: "catalogue-1",
        from: P.marta,
        to: [ME],
        cc: [P.tomas],
        date: "2026-10-20T10:14",
        body: "Hi Nora,\n\nThe product shots from Abisko are in, so we're ready for the spring catalogue layout. 48 pages as before, same trim size, but we'd like the jackets section to open the book this time.\n\nCould you have a first proof by Friday? Our print slot at Harbour is booked for 9 November.\n\nThanks,\nMarta",
      },
      {
        id: "catalogue-2",
        from: ME,
        to: [P.marta],
        cc: [P.tomas],
        date: "2026-10-21T08:37",
        body: "Hi Marta,\n\nFriday works. Tomás is on the layout and I'll do the cover and the section openers. We'll send a PDF proof with comments switched on, so your team can mark it up directly.\n\nNora",
      },
      {
        id: "catalogue-3",
        from: P.marta,
        to: [ME],
        cc: [P.tomas],
        date: "2026-10-23T16:52",
        body: "This looks great, thank you both. A few notes from the team:\n\n1. Page 14: the jackets spread feels crowded. Could the 3-in-1 jacket get the full right-hand page?\n2. The price on the Tarn hiking boot should be 1,895 SEK, not 1,995.\n3. Cover: we love option B. Could we try it with the logo in white?\n\nMarked-up proof attached. If you can turn it around by Wednesday we're still on schedule.\n\nMarta",
        attachments: [{ name: "Kestrel-SS27-catalogue-proof-v3-comments.pdf", size: 14.2 * MB, kind: "pdf" }],
      },
      {
        id: "catalogue-4",
        from: P.tomas,
        to: [P.marta],
        cc: [ME],
        date: "2026-10-24T08:52",
        body: "Morning Marta,\n\nThanks for the notes. I'll fix the spread on page 14 and the boot price on Monday; the white logo on cover B is attached as a quick mock-up so you can see it before then.\n\nTomás",
        attachments: [{ name: "cover-B-white-logo.png", size: 2.4 * MB, kind: "image" }],
      },
    ],
  },
  {
    id: "harbour-invoice",
    folder: "inbox",
    subject: "Invoice HP-2026-114 for the Kestrel print run",
    unread: true,
    starred: false,
    labels: ["invoices"],
    messages: [
      {
        id: "harbour-invoice-1",
        from: P.daniel,
        to: [ME],
        date: "2026-10-24T08:47",
        body: "Hello Nora,\n\nPlease find attached our invoice for the deposit on the Kestrel spring catalogue: 4,000 copies, 48 pages, Munken Lynx 130 g.\n\nAmount: 18,400 SEK including VAT, payable within 30 days. The balance is invoiced on delivery.\n\nKind regards,\nDaniel Osei\nHarbour Print Co.",
        attachments: [{ name: "HP-2026-114.pdf", size: 186 * KB, kind: "pdf" }],
      },
    ],
  },
  {
    id: "lumen",
    folder: "inbox",
    subject: "Lumen Dental: logo round 2 feedback",
    unread: true,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "lumen-1",
        from: P.priya,
        to: [ME],
        date: "2026-10-19T13:05",
        body: "Hi Nora,\n\nWe've shared round 2 with the partners. Overall a clear favourite: the tooth-and-sunrise mark (option 2). Before we go further, could you show it in a couple of greens? The blue reads a bit clinical to them, which is funny for a dental group, I know.\n\nPriya",
      },
      {
        id: "lumen-2",
        from: ME,
        to: [P.priya],
        date: "2026-10-19T15:40",
        body: "Hi Priya,\n\nGreat to hear. Not funny at all, it's the most common note we get from clinics! I'll put option 2 in three greens, from sage to a deeper pine, and show each on the sign, a business card and the booking app icon.\n\nExpect it Wednesday.\n\nNora",
      },
      {
        id: "lumen-3",
        from: P.priya,
        to: [ME],
        date: "2026-10-21T17:22",
        body: "Thanks for the greens. The middle one is the winner. One worry: on the app icon at small sizes, the sunrise lines merge into a blob. Is there a simpler version for small sizes?",
        attachments: [{ name: "app-icon-at-29px.png", size: 88 * KB, kind: "image" }],
      },
      {
        id: "lumen-4",
        from: P.tomas,
        to: [P.priya],
        cc: [ME],
        date: "2026-10-22T11:09",
        body: "Hi Priya, Tomás here. Yes: below 48 px we drop to three sunrise lines and thicken them. Here's the small-size version next to the full one. It holds up down to 16 px, which covers the favicon.",
        attachments: [
          { name: "lumen-mark-small-sizes.pdf", size: 1.1 * MB, kind: "pdf" },
          { name: "favicon-preview.png", size: 24 * KB, kind: "image" },
        ],
      },
      {
        id: "lumen-5",
        from: P.priya,
        to: [ME, P.tomas],
        date: "2026-10-23T18:12",
        body: "Perfect, that solves it. The partners approved the mark in green with the small-size version.\n\nNext step on our side is the signage company. They're asking for the files by 6 November: the logo as vector, the colour values for paint, and a simple guide for spacing. Is that something you can include?\n\nAnd could you send the invoice for round 2? Accounts closes the month on the 30th.\n\nPriya",
      },
    ],
  },
  {
    id: "standup",
    folder: "inbox",
    subject: "Monday's stand-up moved to 10:30",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "standup-1",
        from: P.lena,
        to: [ME, P.tomas],
        date: "2026-10-23T16:20",
        body: "Hi both, the heating engineer comes at 9 on Monday, so let's move stand-up to 10:30. Coffee's on me.",
      },
      {
        id: "standup-2",
        from: P.tomas,
        to: [P.lena, ME],
        date: "2026-10-23T16:45",
        body: "Works for me. I'll bring the Lumen boards so we can pin them up.",
      },
    ],
  },
  {
    id: "mum-lunch",
    folder: "inbox",
    subject: "Sunday lunch?",
    unread: true,
    starred: false,
    labels: ["family"],
    messages: [
      {
        id: "mum-lunch-1",
        from: P.mum,
        to: [ME],
        cc: [P.felix],
        date: "2026-10-24T07:40",
        body: "Hej älskling,\n\nDad is making his fish soup tomorrow. Come at one if you can, and bring Felix if he's back from the cabin. I found the old photo albums in the attic, you'll want to see the one from Gotland.\n\nKram,\nMamma",
      },
    ],
  },
  {
    id: "vat",
    folder: "inbox",
    subject: "Q3 VAT return: three receipts missing",
    unread: true,
    starred: true,
    labels: ["invoices"],
    messages: [
      {
        id: "vat-1",
        from: P.ruth,
        to: [ME],
        date: "2026-10-22T09:15",
        body: "Dear Nora,\n\nI'm finishing the VAT return for July to September and there are three card payments without receipts:\n\n- 14 Aug, 2,340 SEK, Brushwork software\n- 2 Sep, 612 SEK, Northline Rail\n- 19 Sep, 4,980 SEK, Hyllan Möbler\n\nCould you upload them to the shared folder? The deadline is 12 November.\n\nBest regards,\nRuth Adeyemi\nAdeyemi & Co.",
        attachments: [{ name: "Q3-receipts-checklist.xlsx", size: 31 * KB, kind: "sheet" }],
      },
      {
        id: "vat-2",
        from: ME,
        to: [P.ruth],
        date: "2026-10-22T12:02",
        body: "Hi Ruth, thanks. The Brushwork and Northline receipts are uploaded now. The Hyllan one was the studio shelving; I'll dig the paper receipt out on Monday.",
      },
      {
        id: "vat-3",
        from: P.ruth,
        to: [ME],
        date: "2026-10-23T09:30",
        body: "Got them, thank you. A photo of the paper receipt is fine for the last one. If it can't be found, a bank statement line plus a note of what it was will do.",
      },
    ],
  },
  {
    id: "tea",
    folder: "inbox",
    subject: "New packaging range: can we talk?",
    unread: true,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "tea-1",
        from: P.aiko,
        to: [ME],
        date: "2026-10-23T14:22",
        body: "Hello Nora,\n\nI run Tanaka Tea House on Davidshallstorg. A friend at Kestrel showed me your catalogue work and I loved it.\n\nWe're launching a range of six loose-leaf teas in the spring and need packaging: tins, labels and a small booklet. Would you have time for a coffee, or a tea, in the next two weeks to talk about it?\n\nWarmly,\nAiko Tanaka",
      },
    ],
  },
  {
    id: "rail",
    folder: "inbox",
    subject: "Your booking: Malmö C → København H, 6 November",
    unread: false,
    starred: false,
    labels: ["travel"],
    messages: [
      {
        id: "rail-1",
        from: P.rail,
        to: [ME],
        date: "2026-10-22T19:03",
        body: "Thank you for travelling with Northline Rail.\n\nBooking reference: NL-48213\nFriday 6 November, Malmö C 08:12 → København H 08:51\nReturn: Friday 6 November, København H 18:20 → Malmö C 18:59\n1 adult, second class, flexible\n\nYour tickets are attached. Show them on your phone or print them.",
        attachments: [{ name: "ticket-NL-48213.pdf", size: 96 * KB, kind: "pdf" }],
      },
    ],
  },
  {
    id: "kerning",
    folder: "inbox",
    subject: "The Kerning Post #212: variable fonts in print",
    unread: true,
    starred: false,
    labels: [],
    messages: [
      {
        id: "kerning-1",
        from: P.kerning,
        to: [ME],
        date: "2026-10-24T06:00",
        body: "This week: why printers still ask for static instances, how three foundries are pricing variable licences, and a long look at the new Swedish road signage typeface.\n\nPlus: our reader survey closes on Friday. Tell us what you'd like more of.",
      },
    ],
  },
  {
    id: "library",
    folder: "inbox",
    subject: "Oakridge Library: reading festival posters",
    unread: false,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "library-1",
        from: P.hugo,
        to: [ME],
        date: "2026-10-23T11:05",
        body: "Dear Nora,\n\nThank you for the quote. The committee has approved it. The final copy for the three posters is attached; the festival dates are 20 to 29 November.\n\nWe'd need the A2 posters for the branches and an A4 version we can print in-house. Is the end of next week realistic?\n\nWith thanks,\nHugo Bernard\nCommunications, Oakridge Library",
        attachments: [{ name: "festival-poster-copy-final.docx", size: 42 * KB, kind: "doc" }],
      },
    ],
  },
  {
    id: "heating",
    folder: "inbox",
    subject: "Studio heating service on Monday",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "heating-1",
        from: P.sven,
        to: [ME, P.lena],
        date: "2026-10-22T08:30",
        body: "Hello,\n\nThe heating engineer will service the radiators in your unit on Monday 26 October from 09:00. It takes about an hour. Please clear a path to the radiators under the windows.\n\nRegards,\nSven Ahlgren\nAhlgren Fastigheter",
      },
    ],
  },
  {
    id: "fonts",
    folder: "inbox",
    subject: "Font licence for the Kestrel catalogue",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "fonts-1",
        from: P.tomas,
        to: [ME],
        date: "2026-10-21T10:48",
        body: "Our desktop licence for Fold Grotesk covers five seats but not the e-book version of the catalogue Kestrel mentioned. The foundry quoted 3,200 SEK for an e-pub licence. Shall I go ahead?",
        attachments: [{ name: "fold-grotesk-epub-quote.pdf", size: 64 * KB, kind: "pdf" }],
      },
      {
        id: "fonts-2",
        from: ME,
        to: [P.tomas],
        date: "2026-10-21T11:20",
        body: "Yes, go ahead, and put it on the Kestrel job so it goes on their invoice.",
      },
    ],
  },
  {
    id: "cloudnest",
    folder: "inbox",
    subject: "Your plan for fernhill.studio renews on 2 November",
    unread: false,
    starred: false,
    labels: ["invoices"],
    messages: [
      {
        id: "cloudnest-1",
        from: P.cloudnest,
        to: [ME],
        date: "2026-10-21T07:00",
        body: "Hi Nora,\n\nYour Studio plan for fernhill.studio renews on 2 November for 1,188 SEK a year. The card ending in 4417 will be charged.\n\nNothing to do if that's fine. To change plan or card, open Billing in your Cloudnest account.",
      },
    ],
  },
  {
    id: "cabin",
    folder: "inbox",
    subject: "Photos from the cabin",
    unread: false,
    starred: true,
    labels: ["family"],
    messages: [
      {
        id: "cabin-1",
        from: P.felix,
        to: [ME, P.mum],
        date: "2026-10-19T20:31",
        body: "First snow up at the cabin! The lake froze at the edges overnight. Three of the best attached, the rest are in the shared album.\n\nDriving back on Saturday.",
        attachments: [
          { name: "IMG_2041.jpg", size: 3.8 * MB, kind: "image" },
          { name: "IMG_2047.jpg", size: 4.1 * MB, kind: "image" },
          { name: "IMG_2058.jpg", size: 3.5 * MB, kind: "image" },
        ],
      },
    ],
  },
  {
    id: "panel",
    folder: "inbox",
    subject: "Portfolio reviews on 12 November: you're on the panel",
    unread: false,
    starred: false,
    labels: [],
    messages: [
      {
        id: "panel-1",
        from: P.joanna,
        to: [ME],
        date: "2026-10-13T14:10",
        body: "Hi Nora,\n\nThank you for agreeing to sit on the graduate portfolio panel again. It's on Thursday 12 November, 13:00 to 17:00, in the main hall. Twelve students, twenty minutes each. Lunch is provided before.\n\nBest,\nJoanna",
      },
    ],
  },
  {
    id: "samples",
    folder: "inbox",
    subject: "Paper samples are on their way",
    unread: false,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "samples-1",
        from: P.daniel,
        to: [ME],
        date: "2026-10-12T09:22",
        body: "Hi Nora, the Munken and Arctic Volume samples you asked for left today by courier. You should have them tomorrow before noon.\n\nDaniel",
      },
    ],
  },
  {
    id: "speaker",
    folder: "inbox",
    subject: "Speaker confirmation: Nordic Design Days 2027",
    unread: false,
    starred: true,
    labels: ["travel"],
    messages: [
      {
        id: "speaker-1",
        from: P.nddays,
        to: [ME],
        date: "2026-10-09T12:00",
        body: "Dear Nora,\n\nWe're delighted to confirm your talk \"Print is not dead, it's just quieter\" at Nordic Design Days, Copenhagen, 4 to 6 March 2027. Your slot is on Thursday 4 March at 11:00, 30 minutes plus questions.\n\nWe'll book your train and two nights at the conference hotel. Please reply with any dietary needs.",
      },
    ],
  },
  {
    id: "application",
    folder: "inbox",
    subject: "Application: junior designer (portfolio attached)",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "application-1",
        from: P.wen,
        to: [ME],
        date: "2026-10-06T21:47",
        body: "Dear Ms Lindqvist,\n\nI'm finishing my degree in visual communication at the Malmö School of Arts and would love to apply for the junior designer role you posted. My portfolio is attached; the packaging project for a Gothenburg brewery on pages 8 to 15 is the one I'm proudest of.\n\nThank you for your time,\nWen Li",
        attachments: [{ name: "WenLi-portfolio-2026.pdf", size: 22.6 * MB, kind: "pdf" }],
      },
    ],
  },

  // Snoozed
  {
    id: "insurance",
    folder: "snoozed",
    subject: "Renew your studio contents insurance",
    unread: false,
    starred: false,
    labels: ["studio"],
    snoozedUntil: "2026-10-26T08:00",
    messages: [
      {
        id: "insurance-1",
        from: P.halvard,
        to: [ME],
        date: "2026-10-15T10:00",
        body: "Your policy HC-55120 for Fernhill Studio AB ends on 30 November. Renew before then to stay covered. Your new premium is 4,260 SEK a year, up 3% on last year.",
      },
    ],
  },
  {
    id: "dentist",
    folder: "snoozed",
    subject: "Reminder: your appointment on 30 October",
    unread: false,
    starred: false,
    labels: [],
    snoozedUntil: "2026-10-29T08:00",
    messages: [
      {
        id: "dentist-1",
        from: P.dentist,
        to: [ME],
        date: "2026-10-16T08:15",
        body: "This is a reminder of your check-up on Friday 30 October at 15:20 with Dr Holm. Reply to this message if you need to change the time.",
      },
    ],
  },

  // Sent
  {
    id: "quote-library",
    folder: "sent",
    subject: "Quote for the reading festival posters",
    unread: false,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "quote-library-1",
        from: ME,
        to: [P.hugo],
        date: "2026-10-20T15:10",
        body: "Dear Hugo,\n\nAs promised, our quote for the three festival posters is attached: design, one round of changes, and print-ready files at A2 and A4. 14,500 SEK excluding VAT.\n\nBest wishes,\nNora",
        attachments: [{ name: "Fernhill-quote-OL-0412.pdf", size: 118 * KB, kind: "pdf" }],
      },
    ],
  },
  {
    id: "server-move",
    folder: "sent",
    subject: "Moving our files to the new server",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "server-move-1",
        from: ME,
        to: [P.lena, P.tomas],
        date: "2026-10-22T17:30",
        body: "Hi both,\n\nThe new file server goes live on Monday. Please make sure everything you're working on is saved to the shared drive by Friday evening; I'll copy it over during the weekend.\n\nNora",
      },
    ],
  },
  {
    id: "dad-present",
    folder: "sent",
    subject: "Re: Birthday present for Dad",
    unread: false,
    starred: false,
    labels: ["family"],
    messages: [
      {
        id: "dad-present-1",
        from: ME,
        to: [P.mum, P.felix],
        date: "2026-10-20T21:05",
        body: "The fishing reel sounds perfect. I'll go halves with Felix. Can you find out which one he's been looking at without asking him directly?",
      },
    ],
  },
  {
    id: "invoice-lumen",
    folder: "sent",
    subject: "Invoice FS-0388: Lumen Dental, logo round 1",
    unread: false,
    starred: false,
    labels: ["invoices", "clients"],
    messages: [
      {
        id: "invoice-lumen-1",
        from: ME,
        to: [P.priya],
        date: "2026-10-12T10:00",
        body: "Hi Priya,\n\nPlease find attached our invoice for round 1 of the Lumen Dental identity, as agreed in the proposal. Payment within 30 days to the account on the invoice.\n\nThank you,\nNora",
        attachments: [{ name: "FS-0388.pdf", size: 142 * KB, kind: "pdf" }],
      },
    ],
  },

  // Drafts
  {
    id: "draft-newsletter",
    folder: "drafts",
    subject: "Studio newsletter: autumn",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "draft-newsletter-1",
        from: ME,
        to: [P.lena],
        date: "2026-10-23T12:44",
        body: "Lena, a first go at the autumn newsletter, can you check the dates?\n\nThis autumn we finished the Kestrel catalogue, started a new identity for Lumen Dental, and moved",
      },
    ],
  },
  {
    id: "draft-rates",
    folder: "drafts",
    subject: "Our rates for 2027",
    unread: false,
    starred: false,
    labels: [],
    messages: [
      {
        id: "draft-rates-1",
        from: ME,
        to: [],
        date: "2026-10-18T19:20",
        body: "Dear clients,\n\nFrom 1 January our day rate goes from 7,800 to 8,200 SEK. Projects already agreed keep the old rate until they finish.",
      },
    ],
  },

  // Archive
  {
    id: "kickoff",
    folder: "archive",
    subject: "Kestrel kickoff notes",
    unread: false,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "kickoff-1",
        from: P.marta,
        to: [ME, P.tomas],
        date: "2026-09-28T15:30",
        body: "Thanks for coming up to Östersund! Notes from the day are attached. The main points: fewer pages per product, more landscape, and the price list moves to a separate insert.",
        attachments: [{ name: "kickoff-notes.pdf", size: 412 * KB, kind: "pdf" }],
      },
      {
        id: "kickoff-2",
        from: ME,
        to: [P.marta, P.tomas],
        date: "2026-09-29T09:05",
        body: "Thank you for having us, and for the reindeer stew. We'll send the flat plan by the end of next week.",
      },
    ],
  },
  {
    id: "contract-lumen",
    folder: "archive",
    subject: "Signed contract: Lumen Dental identity",
    unread: false,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "contract-lumen-1",
        from: P.priya,
        to: [ME],
        date: "2026-09-22T11:40",
        body: "Signed by both partners, attached. Looking forward to working with you!",
        attachments: [{ name: "Lumen-Fernhill-agreement-signed.pdf", size: 980 * KB, kind: "pdf" }],
      },
    ],
  },
  {
    id: "keys",
    folder: "archive",
    subject: "Re: Spare studio keys",
    unread: false,
    starred: false,
    labels: ["studio"],
    messages: [
      {
        id: "keys-1",
        from: ME,
        to: [P.sven],
        date: "2026-09-02T08:50",
        body: "Hi Sven, could we have a third key cut for the studio? We have a new designer starting.",
      },
      {
        id: "keys-2",
        from: P.sven,
        to: [ME],
        date: "2026-09-02T13:15",
        body: "Of course. It will be at the front desk from Thursday; 150 SEK on the next rent invoice.",
      },
    ],
  },
  {
    id: "receipt-rail",
    folder: "archive",
    subject: "Your Northline receipt",
    unread: false,
    starred: false,
    labels: ["travel", "invoices"],
    messages: [
      {
        id: "receipt-rail-1",
        from: P.rail,
        to: [ME],
        date: "2026-09-15T18:02",
        body: "Receipt for booking NL-40977: Malmö C → Östersund C and return, 2 adults, 3,412 SEK paid by card ending in 4417.",
        attachments: [{ name: "receipt-NL-40977.pdf", size: 54 * KB, kind: "pdf" }],
      },
    ],
  },
  {
    id: "brand-assets",
    folder: "archive",
    subject: "Kestrel brand assets",
    unread: false,
    starred: false,
    labels: ["clients"],
    messages: [
      {
        id: "brand-assets-1",
        from: P.marta,
        to: [ME],
        date: "2026-08-31T10:12",
        body: "The brand guidelines and logo files, as promised. The zip has everything from the 2024 refresh.",
        attachments: [{ name: "Kestrel-brand-2024.zip", size: 86.4 * MB, kind: "zip" }],
      },
    ],
  },

  // Spam
  {
    id: "spam-prize",
    folder: "spam",
    subject: "Congratulations! You have been selected",
    unread: true,
    starred: false,
    labels: [],
    messages: [
      {
        id: "spam-prize-1",
        from: P.prize,
        to: [ME],
        date: "2026-10-23T03:12",
        body: "Dear lucky winner, your email address was selected to receive a premium espresso machine. To claim it, confirm your delivery details and pay a small handling fee within 24 hours.",
      },
    ],
  },
  {
    id: "spam-invoice",
    folder: "spam",
    subject: "Overdue invoice: action required today",
    unread: true,
    starred: false,
    labels: [],
    messages: [
      {
        id: "spam-invoice-1",
        from: P.accounts,
        to: [ME],
        date: "2026-10-22T05:41",
        body: "Your account has an unpaid balance. Sign in to the secure portal with your bank details to avoid a late fee. This link expires in 2 hours.",
      },
    ],
  },
  {
    id: "spam-growth",
    folder: "spam",
    subject: "Grow your studio's followers 10× in 30 days",
    unread: false,
    starred: false,
    labels: [],
    messages: [
      {
        id: "spam-growth-1",
        from: P.growth,
        to: [ME],
        date: "2026-10-17T11:11",
        body: "Hi there! We noticed your studio's account and think it deserves more attention. Our proven system has helped 2,000 creatives go viral.",
      },
    ],
  },

  // Trash
  {
    id: "trash-stock",
    folder: "trash",
    subject: "Last chance: 40% off every stock photo",
    unread: false,
    starred: false,
    labels: [],
    messages: [
      {
        id: "trash-stock-1",
        from: P.pixel,
        to: [ME],
        date: "2026-10-20T09:00",
        body: "Our autumn sale ends at midnight. Every image, video and illustration at 40% off with the code AUTUMN40.",
      },
    ],
  },
  {
    id: "trash-lunch",
    folder: "trash",
    subject: "Lunch on Thursday?",
    unread: false,
    starred: false,
    labels: [],
    messages: [
      {
        id: "trash-lunch-1",
        from: P.tomas,
        to: [ME],
        date: "2026-10-14T11:30",
        body: "Falafel place on Möllan? I can do 12:15.",
      },
      {
        id: "trash-lunch-2",
        from: ME,
        to: [P.tomas],
        date: "2026-10-14T11:41",
        body: "Yes please.",
      },
    ],
  },
];
