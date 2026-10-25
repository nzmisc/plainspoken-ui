// The demo data for "Tally", an invoicing and projects app, as used by Brightwater Studio, a
// small design and web studio in Lisbon, on Saturday 24 October 2026. Fictional people and
// companies. Money is in euros, dates are ISO strings, times wall-clock ("2026-10-24T09:12").

export const APP_TODAY = "2026-10-24";
export const APP_NOW = "2026-10-24T10:30";

export const PRODUCT = "Tally";
export const WORKSPACE = "Brightwater Studio";

export type CustomerStatus = "Active" | "Overdue" | "Lead" | "Archived";
export type InvoiceStatus = "Paid" | "Open" | "Overdue" | "Draft";
export type ProjectStage = "Planned" | "In progress" | "Review" | "Done";
export type TeamRole = "Owner" | "Admin" | "Member" | "Billing";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  title: string;
  status: "Active" | "Invited";
  /** When they were last signed in */
  lastActive: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  industry: string;
  status: CustomerStatus;
  /** Customer since */
  since: string;
  /** Unpaid, euros */
  balance: number;
  /** Everything ever invoiced, euros */
  lifetime: number;
  lastInvoice: string | null;
  /** Team member who looks after them */
  owner: string;
  website: string;
  notes: string;
}

export interface Invoice {
  number: string;
  customer: string;
  issued: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  customer: string;
  stage: ProjectStage;
  due: string;
  budget: number;
  spent: number;
  tasksDone: number;
  tasks: number;
  team: string[];
  priority: "High" | "Normal" | "Low";
}

export interface ActivityItem {
  id: string;
  who: string;
  /** "paid", "sent", "commented on"… the verb, in the past tense */
  what: string;
  /** What it happened to: an invoice number, a project */
  target: string;
  href?: string;
  when: string;
  kind: "payment" | "invoice" | "project" | "comment" | "customer";
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
  kind: "payment" | "overdue" | "comment" | "invite";
}

// Team -------------------------------------------------------------------------------------------

export const TEAM: TeamMember[] = [
  { id: "mateo", name: "Mateo Alvarez", email: "mateo@brightwater.studio", role: "Owner", title: "Founder, creative director", status: "Active", lastActive: "2026-10-24T10:21" },
  { id: "ines", name: "Inês Carvalho", email: "ines@brightwater.studio", role: "Admin", title: "Studio manager", status: "Active", lastActive: "2026-10-24T09:02" },
  { id: "sam", name: "Sam Okoro", email: "sam@brightwater.studio", role: "Member", title: "Developer", status: "Active", lastActive: "2026-10-23T18:40" },
  { id: "julia", name: "Julia Nowak", email: "julia@brightwater.studio", role: "Member", title: "Designer", status: "Active", lastActive: "2026-10-23T17:15" },
  { id: "pedro", name: "Pedro Santos", email: "pedro@contas-santos.example", role: "Billing", title: "Accountant (external)", status: "Active", lastActive: "2026-10-20T11:30" },
  { id: "rosa", name: "Rosa Lima", email: "rosa.lima@mailbox.example", role: "Member", title: "Junior designer", status: "Invited", lastActive: "" },
];

export const ME = TEAM[0];

// Customers --------------------------------------------------------------------------------------

export const CUSTOMERS: Customer[] = [
  { id: "harbor-coffee", name: "Harbor Coffee Roasters", contact: "Amara Nwosu", email: "amara@harborcoffee.example", phone: "+351 912 448 201", city: "Lisbon", country: "Portugal", industry: "Food and drink", status: "Active", since: "2023-03-14", balance: 4200, lifetime: 48600, lastInvoice: "2026-10-19", owner: "Julia Nowak", website: "harborcoffee.example", notes: "Rebrand in 2023, packaging since. Prefers invoices at the start of the month. Amara signs off on everything herself." },
  { id: "northwind-cycles", name: "Northwind Cycles", contact: "Jonas Weber", email: "jonas@northwindcycles.example", phone: "+49 30 2209 5512", city: "Berlin", country: "Germany", industry: "Retail", status: "Overdue", since: "2024-06-02", balance: 11850, lifetime: 39200, lastInvoice: "2026-09-02", owner: "Sam Okoro", website: "northwindcycles.example", notes: "Online shop rebuild. Invoice INV-2026-0128 is 22 days late; Jonas says their finance team changed banks." },
  { id: "oakridge-library", name: "Oakridge Public Library", contact: "Hugo Bernard", email: "h.bernard@oakridge.example", phone: "+33 4 72 10 30 00", city: "Lyon", country: "France", industry: "Public sector", status: "Active", since: "2025-01-20", balance: 0, lifetime: 21300, lastInvoice: "2026-10-02", owner: "Inês Carvalho", website: "oakridge.example", notes: "Pays by purchase order: put the PO number on every invoice." },
  { id: "pinecrest-clinic", name: "Pinecrest Family Clinic", contact: "Sofia Marques", email: "sofia.marques@pinecrest.example", phone: "+351 225 019 744", city: "Porto", country: "Portugal", industry: "Healthcare", status: "Active", since: "2025-09-08", balance: 2600, lifetime: 9800, lastInvoice: "2026-10-12", owner: "Julia Nowak", website: "pinecrest.example", notes: "Booking site and signage. Accessibility audit planned for January." },
  { id: "tidewater-brewing", name: "Tidewater Brewing Co.", contact: "Kenji Watanabe", email: "kenji@tidewater.example", phone: "+31 10 744 2290", city: "Rotterdam", country: "Netherlands", industry: "Food and drink", status: "Active", since: "2022-11-30", balance: 0, lifetime: 64100, lastInvoice: "2026-10-05", owner: "Mateo Alvarez", website: "tidewater.example", notes: "Our longest client. Seasonal labels four times a year; the winter range is due in November." },
  { id: "meridian-architects", name: "Meridian Architects", contact: "Léa Dubois", email: "lea@meridian-arch.example", phone: "+33 1 84 60 21 77", city: "Paris", country: "France", industry: "Architecture", status: "Overdue", since: "2024-02-11", balance: 7400, lifetime: 33500, lastInvoice: "2026-08-28", owner: "Mateo Alvarez", website: "meridian-arch.example", notes: "Portfolio site. Second reminder sent on 20 October." },
  { id: "copperleaf-tea", name: "Copperleaf Tea", contact: "Aiko Tanaka", email: "aiko@copperleaf.example", phone: "+31 20 811 4026", city: "Amsterdam", country: "Netherlands", industry: "Food and drink", status: "Lead", since: "2026-10-21", balance: 0, lifetime: 0, lastInvoice: null, owner: "Inês Carvalho", website: "copperleaf.example", notes: "Wants tins and labels for six teas. Call booked for 28 October." },
  { id: "silverline-logistics", name: "Silverline Logistics", contact: "Omar Haddad", email: "omar.haddad@silverline.example", phone: "+49 40 3008 1170", city: "Hamburg", country: "Germany", industry: "Logistics", status: "Active", since: "2025-05-06", balance: 5300, lifetime: 27450, lastInvoice: "2026-10-15", owner: "Sam Okoro", website: "silverline.example", notes: "Driver app and tracking pages. Retainer of 20 hours a month." },
  { id: "bluebird-books", name: "Bluebird Books", contact: "Ruth Adeyemi", email: "ruth@bluebirdbooks.example", phone: "+353 1 677 0942", city: "Dublin", country: "Ireland", industry: "Retail", status: "Active", since: "2024-09-17", balance: 0, lifetime: 12900, lastInvoice: "2026-09-30", owner: "Julia Nowak", website: "bluebirdbooks.example", notes: "Event posters and the newsletter template." },
  { id: "fjord-outdoor", name: "Fjord Outdoor", contact: "Ingrid Solberg", email: "ingrid@fjordoutdoor.example", phone: "+47 55 30 18 40", city: "Bergen", country: "Norway", industry: "Retail", status: "Active", since: "2025-03-03", balance: 9900, lifetime: 41800, lastInvoice: "2026-10-20", owner: "Mateo Alvarez", website: "fjordoutdoor.example", notes: "Spring catalogue, 64 pages. Invoices in euros although they're in Norway." },
  { id: "atlas-fitness", name: "Atlas Fitness Studios", contact: "Marco Bianchi", email: "marco@atlasfitness.example", phone: "+39 02 8734 1190", city: "Milan", country: "Italy", industry: "Fitness", status: "Overdue", since: "2025-07-22", balance: 3150, lifetime: 14600, lastInvoice: "2026-09-10", owner: "Sam Okoro", website: "atlasfitness.example", notes: "Class booking app. Asked to split the last invoice over two months." },
  { id: "greenhouse-coop", name: "Greenhouse Co-op", contact: "Emma Lindqvist", email: "emma@greenhouse.example", phone: "+46 40 611 2080", city: "Malmö", country: "Sweden", industry: "Food and drink", status: "Archived", since: "2023-05-15", balance: 0, lifetime: 8700, lastInvoice: "2025-04-30", owner: "Julia Nowak", website: "greenhouse.example", notes: "Closed in spring 2025. Kept for the records." },
  { id: "riverside-theatre", name: "Riverside Theatre", contact: "Daniel Osei", email: "daniel@riversidetheatre.example", phone: "+44 117 496 0322", city: "Bristol", country: "United Kingdom", industry: "Arts", status: "Active", since: "2024-01-09", balance: 1800, lifetime: 30250, lastInvoice: "2026-10-09", owner: "Inês Carvalho", website: "riversidetheatre.example", notes: "Season brochure and ticketing pages. The winter season goes live 1 December." },
  { id: "lumen-dental", name: "Lumen Dental", contact: "Priya Raman", email: "priya@lumendental.example", phone: "+44 20 7946 0581", city: "London", country: "United Kingdom", industry: "Healthcare", status: "Active", since: "2026-09-22", balance: 6200, lifetime: 6200, lastInvoice: "2026-10-12", owner: "Mateo Alvarez", website: "lumendental.example", notes: "New identity. Round 2 approved; signage files due 6 November." },
  { id: "quarry-bakery", name: "Quarry & Stone Bakery", contact: "Tomás Ruiz", email: "tomas@quarrystone.example", phone: "+34 963 52 77 10", city: "Valencia", country: "Spain", industry: "Food and drink", status: "Active", since: "2025-10-01", balance: 0, lifetime: 5400, lastInvoice: "2026-09-15", owner: "Julia Nowak", website: "quarrystone.example", notes: "Menu boards and a one-page site." },
  { id: "nimbus-weather", name: "Nimbus Weather", contact: "Felix Braun", email: "felix@nimbusweather.example", phone: "+43 1 890 2245", city: "Vienna", country: "Austria", industry: "Software", status: "Lead", since: "2026-10-14", balance: 0, lifetime: 0, lastInvoice: null, owner: "Sam Okoro", website: "nimbusweather.example", notes: "Dashboard redesign. Proposal sent 16 October." },
  { id: "saltmarsh-hotel", name: "Saltmarsh Hotel", contact: "Charlotte Evans", email: "charlotte@saltmarsh.example", phone: "+44 1273 960 411", city: "Brighton", country: "United Kingdom", industry: "Hospitality", status: "Active", since: "2024-04-25", balance: 0, lifetime: 18800, lastInvoice: "2026-08-14", owner: "Inês Carvalho", website: "saltmarsh.example", notes: "Booking site upkeep, billed quarterly." },
  { id: "orchard-school", name: "Orchard Lane School", contact: "Wen Li", email: "w.li@orchardlane.example", phone: "+353 21 432 8890", city: "Cork", country: "Ireland", industry: "Education", status: "Active", since: "2025-08-18", balance: 1450, lifetime: 7250, lastInvoice: "2026-10-01", owner: "Julia Nowak", website: "orchardlane.example", notes: "Prospectus and open-day signs." },
  { id: "vela-sailing", name: "Vela Sailing Club", contact: "Nuno Pereira", email: "nuno@velasailing.example", phone: "+351 214 860 330", city: "Cascais", country: "Portugal", industry: "Sport", status: "Archived", since: "2023-06-12", balance: 0, lifetime: 4300, lastInvoice: "2024-07-01", owner: "Mateo Alvarez", website: "velasailing.example", notes: "Regatta posters, 2023 and 2024." },
  { id: "kiln-ceramics", name: "Kiln Ceramics", contact: "Hana Novak", email: "hana@kilnceramics.example", phone: "+420 224 811 507", city: "Prague", country: "Czechia", industry: "Retail", status: "Active", since: "2025-11-04", balance: 2100, lifetime: 11600, lastInvoice: "2026-10-16", owner: "Julia Nowak", website: "kilnceramics.example", notes: "Shop photography art direction and product pages." },
  { id: "polar-labs", name: "Polar Labs", contact: "Mikko Virtanen", email: "mikko@polarlabs.example", phone: "+358 9 4245 1188", city: "Helsinki", country: "Finland", industry: "Software", status: "Active", since: "2024-10-28", balance: 0, lifetime: 52300, lastInvoice: "2026-10-01", owner: "Sam Okoro", website: "polarlabs.example", notes: "Design system work, monthly retainer." },
  { id: "marigold-florists", name: "Marigold Florists", contact: "Isabel Costa", email: "isabel@marigold.example", phone: "+351 213 470 615", city: "Lisbon", country: "Portugal", industry: "Retail", status: "Lead", since: "2026-10-22", balance: 0, lifetime: 0, lastInvoice: null, owner: "Inês Carvalho", website: "marigold.example", notes: "Walked into the studio. Wants a small shop site before Christmas." },
  { id: "ember-games", name: "Ember Game Studios", contact: "Lukas Meyer", email: "lukas@embergames.example", phone: "+49 89 2154 7730", city: "Munich", country: "Germany", industry: "Software", status: "Active", since: "2025-02-17", balance: 8750, lifetime: 36900, lastInvoice: "2026-10-21", owner: "Mateo Alvarez", website: "embergames.example", notes: "Launch trailer titles and the press kit site." },
  { id: "alder-finch", name: "Alder & Finch Legal", contact: "Grace O'Connor", email: "grace@alderfinch.example", phone: "+353 1 905 3360", city: "Dublin", country: "Ireland", industry: "Legal", status: "Overdue", since: "2025-06-30", balance: 4600, lifetime: 15800, lastInvoice: "2026-09-04", owner: "Inês Carvalho", website: "alderfinch.example", notes: "New website. Waiting on their partners' sign-off before paying the last stage." },
];

export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id);

// Invoices ---------------------------------------------------------------------------------------

type InvoiceRow = [number: string, customer: string, issued: string, due: string, amount: number, status: InvoiceStatus, description: string];

const INVOICE_ROWS: InvoiceRow[] = [
  ["INV-2026-0164", "ember-games", "2026-10-21", "2026-11-20", 8750, "Open", "Press kit site, stage 2 of 3"],
  ["INV-2026-0163", "fjord-outdoor", "2026-10-20", "2026-11-19", 9900, "Open", "Spring catalogue, layout"],
  ["INV-2026-0162", "harbor-coffee", "2026-10-19", "2026-11-18", 4200, "Open", "Winter blend packaging"],
  ["INV-2026-0161", "kiln-ceramics", "2026-10-16", "2026-11-15", 2100, "Open", "Product pages, October"],
  ["INV-2026-0160", "silverline-logistics", "2026-10-15", "2026-11-14", 5300, "Open", "Retainer, October"],
  ["INV-2026-0159", "lumen-dental", "2026-10-12", "2026-11-11", 6200, "Open", "Identity, rounds 1 and 2"],
  ["INV-2026-0158", "pinecrest-clinic", "2026-10-12", "2026-11-11", 2600, "Open", "Booking site, stage 2"],
  ["INV-2026-0157", "riverside-theatre", "2026-10-09", "2026-11-08", 1800, "Open", "Season brochure changes"],
  ["INV-2026-0156", "tidewater-brewing", "2026-10-05", "2026-11-04", 6400, "Paid", "Autumn labels, four beers"],
  ["INV-2026-0155", "oakridge-library", "2026-10-02", "2026-11-01", 3900, "Paid", "Reading festival posters"],
  ["INV-2026-0154", "polar-labs", "2026-10-01", "2026-10-31", 7200, "Paid", "Design system retainer, October"],
  ["INV-2026-0153", "orchard-school", "2026-10-01", "2026-10-31", 1450, "Open", "Open-day signs"],
  ["INV-2026-0152", "bluebird-books", "2026-09-30", "2026-10-30", 950, "Paid", "Newsletter template"],
  ["INV-2026-0151", "quarry-bakery", "2026-09-15", "2026-10-15", 1200, "Paid", "Menu boards"],
  ["INV-2026-0150", "atlas-fitness", "2026-09-10", "2026-10-10", 3150, "Overdue", "Booking app, stage 3"],
  ["INV-2026-0149", "alder-finch", "2026-09-04", "2026-10-04", 4600, "Overdue", "Website, final stage"],
  ["INV-2026-0128", "northwind-cycles", "2026-09-02", "2026-10-02", 11850, "Overdue", "Shop rebuild, stage 3"],
  ["INV-2026-0127", "polar-labs", "2026-09-01", "2026-10-01", 7200, "Paid", "Design system retainer, September"],
  ["INV-2026-0121", "meridian-architects", "2026-08-28", "2026-09-27", 7400, "Overdue", "Portfolio site, launch"],
  ["INV-2026-0118", "saltmarsh-hotel", "2026-08-14", "2026-09-13", 2400, "Paid", "Booking site upkeep, Q3"],
  ["INV-2026-0114", "tidewater-brewing", "2026-08-03", "2026-09-02", 5200, "Paid", "Summer labels"],
  ["INV-2026-0109", "harbor-coffee", "2026-07-20", "2026-08-19", 3800, "Paid", "Cold brew cans"],
  ["INV-2026-0104", "fjord-outdoor", "2026-07-08", "2026-08-07", 8800, "Paid", "Catalogue concept"],
  ["INV-2026-0098", "riverside-theatre", "2026-06-30", "2026-07-30", 6400, "Paid", "Season brochure"],
  ["INV-2026-0165", "copperleaf-tea", "2026-10-24", "2026-11-23", 3600, "Draft", "Packaging concepts, deposit"],
  ["INV-2026-0166", "nimbus-weather", "2026-10-24", "2026-11-23", 4800, "Draft", "Dashboard redesign, discovery"],
];

export const INVOICES: Invoice[] = INVOICE_ROWS.map(([number, customer, issued, due, amount, status, description]) => ({ number, customer, issued, due, amount, status, description }));

export const invoicesFor = (customerId: string) => INVOICES.filter((i) => i.customer === customerId);

// Projects ---------------------------------------------------------------------------------------

export const PROJECTS: Project[] = [
  { id: "p-fjord-catalogue", name: "Spring catalogue 2027", customer: "fjord-outdoor", stage: "In progress", due: "2026-11-27", budget: 24000, spent: 13400, tasksDone: 14, tasks: 31, team: ["Mateo Alvarez", "Julia Nowak"], priority: "High" },
  { id: "p-lumen-identity", name: "Identity and signage", customer: "lumen-dental", stage: "Review", due: "2026-11-06", budget: 14000, spent: 11200, tasksDone: 22, tasks: 26, team: ["Mateo Alvarez", "Julia Nowak"], priority: "High" },
  { id: "p-ember-presskit", name: "Press kit site", customer: "ember-games", stage: "In progress", due: "2026-12-04", budget: 26000, spent: 15800, tasksDone: 18, tasks: 40, team: ["Sam Okoro", "Mateo Alvarez"], priority: "Normal" },
  { id: "p-tidewater-winter", name: "Winter labels", customer: "tidewater-brewing", stage: "In progress", due: "2026-11-13", budget: 6400, spent: 2900, tasksDone: 5, tasks: 12, team: ["Julia Nowak"], priority: "Normal" },
  { id: "p-northwind-shop", name: "Shop rebuild, stage 4", customer: "northwind-cycles", stage: "Planned", due: "2027-01-29", budget: 18000, spent: 0, tasksDone: 0, tasks: 22, team: ["Sam Okoro"], priority: "Low" },
  { id: "p-pinecrest-booking", name: "Booking site", customer: "pinecrest-clinic", stage: "Review", due: "2026-10-30", budget: 9800, spent: 9100, tasksDone: 17, tasks: 19, team: ["Sam Okoro", "Julia Nowak"], priority: "High" },
  { id: "p-riverside-season", name: "Winter season pages", customer: "riverside-theatre", stage: "In progress", due: "2026-12-01", budget: 7200, spent: 3100, tasksDone: 6, tasks: 15, team: ["Inês Carvalho", "Sam Okoro"], priority: "Normal" },
  { id: "p-copperleaf-tins", name: "Tea tins and labels", customer: "copperleaf-tea", stage: "Planned", due: "2027-02-15", budget: 12000, spent: 0, tasksDone: 0, tasks: 9, team: ["Julia Nowak", "Inês Carvalho"], priority: "Normal" },
  { id: "p-nimbus-dashboard", name: "Dashboard redesign", customer: "nimbus-weather", stage: "Planned", due: "2027-03-01", budget: 32000, spent: 0, tasksDone: 0, tasks: 6, team: ["Sam Okoro", "Mateo Alvarez"], priority: "High" },
  { id: "p-oakridge-festival", name: "Reading festival posters", customer: "oakridge-library", stage: "Done", due: "2026-10-16", budget: 3900, spent: 3650, tasksDone: 8, tasks: 8, team: ["Julia Nowak"], priority: "Normal" },
  { id: "p-polar-ds", name: "Design system, Q4", customer: "polar-labs", stage: "In progress", due: "2026-12-18", budget: 21600, spent: 7200, tasksDone: 11, tasks: 34, team: ["Sam Okoro", "Inês Carvalho"], priority: "Normal" },
  { id: "p-harbor-winter", name: "Winter blend packaging", customer: "harbor-coffee", stage: "Done", due: "2026-10-17", budget: 4200, spent: 4380, tasksDone: 10, tasks: 10, team: ["Julia Nowak", "Mateo Alvarez"], priority: "Low" },
];

export const STAGES: ProjectStage[] = ["Planned", "In progress", "Review", "Done"];

// Activity and notifications ---------------------------------------------------------------------

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", who: "Tidewater Brewing Co.", what: "paid", target: "INV-2026-0156", href: "/demos/app/customers/tidewater-brewing", when: "2026-10-24T09:48", kind: "payment" },
  { id: "a2", who: "Julia Nowak", what: "moved to Review", target: "Identity and signage", href: "/demos/app/projects", when: "2026-10-24T09:15", kind: "project" },
  { id: "a3", who: "Inês Carvalho", what: "added the lead", target: "Marigold Florists", href: "/demos/app/customers/marigold-florists", when: "2026-10-23T17:52", kind: "customer" },
  { id: "a4", who: "Mateo Alvarez", what: "sent", target: "INV-2026-0164", href: "/demos/app/customers/ember-games", when: "2026-10-23T16:30", kind: "invoice" },
  { id: "a5", who: "Sam Okoro", what: "commented on", target: "Press kit site", href: "/demos/app/projects", when: "2026-10-23T14:05", kind: "comment" },
  { id: "a6", who: "Oakridge Public Library", what: "paid", target: "INV-2026-0155", href: "/demos/app/customers/oakridge-library", when: "2026-10-23T11:20", kind: "payment" },
  { id: "a7", who: "Mateo Alvarez", what: "sent", target: "INV-2026-0163", href: "/demos/app/customers/fjord-outdoor", when: "2026-10-20T10:02", kind: "invoice" },
  { id: "a8", who: "Inês Carvalho", what: "sent a second reminder for", target: "INV-2026-0121", href: "/demos/app/customers/meridian-architects", when: "2026-10-20T09:40", kind: "invoice" },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Payment received", body: "Tidewater Brewing Co. paid INV-2026-0156 (€6,400).", when: "2026-10-24T09:48", unread: true, kind: "payment" },
  { id: "n2", title: "Invoice overdue", body: "INV-2026-0150 for Atlas Fitness Studios was due on 10 October.", when: "2026-10-24T08:00", unread: true, kind: "overdue" },
  { id: "n3", title: "Sam Okoro commented", body: "“Trailer embeds are in. Can someone check the French titles?” on Press kit site.", when: "2026-10-23T14:05", unread: true, kind: "comment" },
  { id: "n4", title: "Payment received", body: "Oakridge Public Library paid INV-2026-0155 (€3,900).", when: "2026-10-23T11:20", unread: false, kind: "payment" },
  { id: "n5", title: "Invitation not yet accepted", body: "Rosa Lima hasn't joined the workspace. The invitation runs out on 30 October.", when: "2026-10-22T09:00", unread: false, kind: "invite" },
];

// Dashboard numbers ------------------------------------------------------------------------------

/** The twelve months up to and including October 2026 */
export const MONTHS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

/** Invoiced and paid per month, euros */
export const REVENUE = {
  invoiced: [28400, 31200, 24800, 29900, 36100, 33800, 38600, 41200, 35900, 30400, 44700, 52350],
  paid: [26100, 29800, 27200, 25400, 32900, 35100, 34200, 39800, 37400, 28800, 36200, 31900],
};

export const STATS = {
  revenue: { value: 52350, previous: 44700, trend: REVENUE.invoiced },
  outstanding: { value: 71250, previous: 58400, trend: [31200, 33800, 29400, 34100, 38900, 36200, 41800, 44900, 47300, 52100, 58400, 71250] },
  overdue: { value: 27000, previous: 19250, trend: [4200, 6800, 3900, 5200, 8400, 6100, 9800, 12400, 10900, 15600, 19250, 27000] },
  daysToPay: { value: 23, previous: 27, trend: [31, 29, 33, 30, 28, 27, 26, 29, 27, 25, 27, 23] },
};

/** Billable hours per person this month */
export const HOURS = [
  { name: "Mateo Alvarez", billable: 96, internal: 38 },
  { name: "Inês Carvalho", billable: 54, internal: 71 },
  { name: "Sam Okoro", billable: 128, internal: 14 },
  { name: "Julia Nowak", billable: 117, internal: 22 },
];

// Billing ----------------------------------------------------------------------------------------

export interface Plan {
  id: string;
  name: string;
  price: number;
  blurb: string;
  features: string[];
}

export const PLANS: Plan[] = [
  { id: "solo", name: "Solo", price: 9, blurb: "For one person sending a few invoices.", features: ["1 seat", "20 invoices a month", "Payment reminders"] },
  { id: "studio", name: "Studio", price: 29, blurb: "For small teams with projects and retainers.", features: ["Up to 8 seats", "Unlimited invoices", "Projects and time", "Accountant access"] },
  { id: "agency", name: "Agency", price: 79, blurb: "For bigger teams and several companies.", features: ["Unlimited seats", "Several workspaces", "Custom invoice templates", "Priority support"] },
];

export const CURRENT_PLAN = "studio";

export const BILLING_HISTORY = [
  { id: "TL-24-10", date: "2026-10-01", amount: 29, status: "Paid" as const },
  { id: "TL-24-09", date: "2026-09-01", amount: 29, status: "Paid" as const },
  { id: "TL-24-08", date: "2026-08-01", amount: 29, status: "Paid" as const },
  { id: "TL-24-07", date: "2026-07-01", amount: 29, status: "Paid" as const },
];
