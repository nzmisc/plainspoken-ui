// Everything the landing-page demo says about its product. Keepwatch is invented: an uptime monitor
// for small teams. Customer names, people and addresses are made up; addresses use .example.
import {
  BellRing,
  CalendarClock,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Timer,
} from "@/registry/plainspoken/lib/icons";

export const BASE = "/demos/landing";

export const href = {
  home: BASE,
  pricing: `${BASE}/pricing`,
  signup: `${BASE}/signup`,
  section: (id: string) => `${BASE}#${id}`,
};

export const PRODUCT = {
  name: "Keepwatch",
  tagline: "Uptime monitoring that only wakes you for real outages.",
  description:
    "Keepwatch checks your websites, APIs and cron jobs from six regions, confirms every failure before it pages anyone, and keeps a public status page up to date for you.",
  domain: "keepwatch.example",
  email: "hello@keepwatch.example",
  sales: "sales@keepwatch.example",
  support: "support@keepwatch.example",
  security: "security@keepwatch.example",
};

export const NAV = [
  { key: "features", label: "Features", href: href.section("features") },
  { key: "how", label: "How it works", href: href.section("how-it-works") },
  { key: "pricing", label: "Pricing", href: href.pricing },
  { key: "faq", label: "FAQ", href: href.section("faq") },
];

export const HERO = {
  eyebrow: "New: phone-call escalation on every paid plan",
  title: "Uptime monitoring that only wakes you for real outages",
  lead: "Keepwatch checks your sites, APIs and cron jobs every 30 seconds from six regions. A failure has to be confirmed from three of them before anyone is paged, and your status page updates itself.",
  note: "Free for 10 checks. No card, no trial clock.",
};

export const CUSTOMERS = {
  title: "Keeping watch for 2,400 small teams, including",
  names: ["Northwind Freight", "Mosswood Books", "Halden Rail", "Brightwater Clinics", "Tidewell Energy", "Corvid Labs", "Fernhill Schools", "Pellucid"],
};

export const FEATURES = [
  {
    icon: Globe,
    title: "HTTP, API and TCP checks",
    text: "Status codes, response bodies, headers and timings, from Frankfurt, Virginia, Oregon, São Paulo, Singapore and Sydney.",
  },
  {
    icon: Timer,
    title: "Cron heartbeats",
    text: "Your scheduled jobs ping a URL when they finish. If a ping is late, you hear about it, with the last output attached.",
  },
  {
    icon: BellRing,
    title: "Confirmed alerts",
    text: "A failure is retried from three regions before it counts. One flaky network path never pages anyone at 3 a.m.",
  },
  {
    icon: LayoutDashboard,
    title: "Status pages",
    text: "A public page on your own domain that updates from your checks, with incident notes and 90 days of history.",
  },
  {
    icon: CalendarClock,
    title: "On-call schedules",
    text: "Weekly rotations, overrides for holidays, and escalation to the next person if nobody answers in five minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Certificates and domains",
    text: "Warnings 30, 14 and 3 days before a TLS certificate or a domain registration runs out.",
  },
];

export const STEPS = [
  {
    title: "Add what to watch",
    text: "Paste a URL, or copy a heartbeat link into the end of a cron job. Sensible defaults: every 30 seconds, from all six regions.",
    detail: "Takes about a minute",
  },
  {
    title: "Say who to tell",
    text: "Email for the small things, SMS and a phone call for outages. Put people on a rotation so the same person isn't always woken.",
    detail: "Import your team from a CSV",
  },
  {
    title: "Get on with your day",
    text: "Keepwatch confirms failures, pages the person on call, opens an incident on your status page and closes it when you recover.",
    detail: "Median time to alert: 41 seconds",
  },
];

export const SPLITS = {
  alerts: {
    eyebrow: "Alerting",
    title: "Checks twice before it wakes anyone",
    text: "Most monitoring alerts are a single failed request from a single place. Keepwatch retries every failure from two other regions within seconds and only pages when the problem is real.",
    points: [
      "Confirmed from three regions, or it doesn't count",
      "SMS, then a phone call, then the next person on the rotation",
      "Acknowledge from the text message with one reply",
    ],
  },
  status: {
    eyebrow: "Status pages",
    title: "A status page your customers will actually read",
    text: "Your checks keep it current, so nobody has to remember to update it in the middle of an outage. Write the incident notes in plain sentences; customers can follow by email or RSS.",
    points: ["Your own domain, with TLS taken care of", "90 days of history per component", "Private pages for internal tools"],
  },
  heartbeats: {
    eyebrow: "Heartbeats",
    title: "Find out when a cron job quietly stops",
    text: "The backup that hasn't run for a month never throws an error. Add one line to the end of a job and Keepwatch notices when the ping doesn't come.",
    points: ["Schedules in cron syntax, with your time zone", "A grace period per job", "The last 10 KB of output in the alert"],
  },
};

export const TESTIMONIALS = [
  {
    quote:
      "We had a monitor that paged us four times a week for blips. In six months on Keepwatch we've been paged nine times, and every one was a real outage.",
    name: "Marta Kos",
    role: "Platform lead",
    company: "Northwind Freight",
  },
  {
    quote:
      "The status page sold it. During our last outage the support inbox stayed quiet, because customers could see we knew and when we expected to be back.",
    name: "Daniel Okafor",
    role: "Head of support",
    company: "Mosswood Books",
  },
  {
    quote: "Heartbeats caught a backup job that had been failing silently for eleven days. That one alert paid for the next ten years.",
    name: "Priya Raman",
    role: "Solo founder",
    company: "Pellucid",
  },
];

export type PlanKey = "hobby" | "team" | "business";

export const PLANS = [
  {
    key: "hobby" as PlanKey,
    name: "Hobby",
    description: "For side projects and personal sites.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: ["10 checks, every 5 minutes", "Email alerts", "1 status page", "1 user"],
  },
  {
    key: "team" as PlanKey,
    name: "Team",
    description: "For a product with customers who notice.",
    monthly: 24,
    yearly: 240,
    cta: "Start a 14-day trial",
    highlight: "Most teams pick this",
    features: ["100 checks, every 30 seconds", "SMS, phone and chat alerts", "On-call schedules", "3 status pages on your domain", "10 users"],
  },
  {
    key: "business" as PlanKey,
    name: "Business",
    description: "For several teams and stricter rules.",
    monthly: 79,
    yearly: 790,
    cta: "Start a 14-day trial",
    features: ["500 checks, every 10 seconds", "Everything in Team", "Single sign-on and audit log", "Unlimited users", "99.95% uptime SLA"],
  },
];

/** The comparison table: true is included, false is not, a string is a value */
export const COMPARISON: { group: string; rows: { feature: string; values: [string | boolean, string | boolean, string | boolean] }[] }[] = [
  {
    group: "Monitoring",
    rows: [
      { feature: "Checks", values: ["10", "100", "500"] },
      { feature: "Shortest interval", values: ["5 min", "30 s", "10 s"] },
      { feature: "Regions", values: ["3", "6", "6"] },
      { feature: "Cron heartbeats", values: ["2", "50", "250"] },
      { feature: "Certificate and domain expiry", values: [true, true, true] },
      { feature: "History kept", values: ["30 days", "1 year", "3 years"] },
    ],
  },
  {
    group: "Alerts",
    rows: [
      { feature: "Email", values: [true, true, true] },
      { feature: "SMS and phone calls", values: [false, "200 a month", "1,000 a month"] },
      { feature: "Chat and webhooks", values: [false, true, true] },
      { feature: "On-call schedules and escalation", values: [false, true, true] },
    ],
  },
  {
    group: "Status pages",
    rows: [
      { feature: "Status pages", values: ["1", "3", "Unlimited"] },
      { feature: "Custom domain", values: [false, true, true] },
      { feature: "Private pages", values: [false, false, true] },
    ],
  },
  {
    group: "Team and support",
    rows: [
      { feature: "Users", values: ["1", "10", "Unlimited"] },
      { feature: "Single sign-on (SAML)", values: [false, false, true] },
      { feature: "Audit log", values: [false, false, true] },
      { feature: "Support", values: ["Community", "Email, 1 working day", "Email and phone, 4 hours"] },
      { feature: "Uptime SLA", values: [false, false, "99.95%"] },
    ],
  },
];

export const FAQ = [
  {
    id: "free",
    q: "Is the Hobby plan really free?",
    a: "Yes, for as long as you like. Ten checks every five minutes, email alerts and one status page. We don't ask for a card, and there's no trial that runs out.",
  },
  {
    id: "confirm",
    q: "How does Keepwatch decide something is down?",
    a: "A check fails when it times out, returns an unexpected status code, or its body doesn't match what you said it should. When one region sees a failure, two others retry within ten seconds. Only if all three agree does the check count as down and the alerting start.",
  },
  {
    id: "false-alarms",
    q: "Will I still get false alarms?",
    a: "Far fewer. Across all customers last quarter, 0.4% of pages were for problems that cleared before anyone looked. If a check of yours is noisy, the check's page shows why, and you can raise its threshold.",
  },
  {
    id: "yearly",
    q: "What do I save by paying yearly?",
    a: "Two months: the Team plan is $240 a year instead of $288, and Business $790 instead of $948. You can switch between monthly and yearly at any time; we credit the unused part.",
  },
  {
    id: "sms",
    q: "What happens when we run out of SMS and calls?",
    a: "Alerts never stop. Messages over your plan's allowance cost $0.04 each and calls $0.10 a minute, billed at the end of the month, and we email you when you pass 80% of the allowance.",
  },
  {
    id: "data",
    q: "Where is our data kept?",
    a: "In the EU, in Frankfurt, with a copy in Amsterdam. Check results are kept for as long as your plan's history and then deleted. We sign a data processing agreement on request.",
  },
  {
    id: "cancel",
    q: "How do I cancel?",
    a: "Delete your account from the settings page. It takes effect at once, we stop billing, and we delete your data within 30 days. There is no call with a retention team.",
  },
];

export const CTA = {
  title: "Start with ten free checks",
  text: "Add your first site in about a minute. If Keepwatch ever pages you for nothing, tell us and we'll look at why.",
};

export const FOOTER = {
  columns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: href.section("features") },
        { label: "How it works", href: href.section("how-it-works") },
        { label: "Pricing", href: href.pricing },
        { label: "Compare plans", href: `${href.pricing}#compare` },
      ],
    },
    {
      title: "Get started",
      links: [
        { label: "Create an account", href: href.signup },
        { label: "Questions", href: href.section("faq") },
        { label: "Billing questions", href: `${href.pricing}#billing-faq` },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "Support", href: `mailto:${PRODUCT.support}` },
        { label: "Sales", href: `mailto:${PRODUCT.sales}` },
        { label: "Report a security issue", href: `mailto:${PRODUCT.security}` },
      ],
    },
  ],
  smallPrint: "© 2026 Keepwatch. Keepwatch is a made-up product for the plainspoken-ui demos; its customers and quotes are invented too.",
};
