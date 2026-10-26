// Everything about the blog demo's fictional author that isn't a post. Ines Varga is made up; every
// address is on example.com or example.org, so nothing points at a real person or account.

export const BASE = "/demos/blog";

export const AUTHOR = {
  name: "Ines Varga",
  role: "Backend and infrastructure engineer",
  location: "Ljubljana, Slovenia",
  email: "ines@example.com",
  code: "https://code.example.org/ines",
  codeLabel: "code.example.org/ines",
  tagline: "Notes on databases, deploys, plain web pages and the occasional bike trip.",
};

export const FEED = `${BASE}/feed.xml`;

export const href = {
  home: BASE,
  posts: `${BASE}/posts`,
  post: (slug: string) => `${BASE}/posts/${slug}`,
  tags: `${BASE}/tags`,
  tag: (tag: string) => `${BASE}/tags/${tag}`,
  about: `${BASE}/about`,
  feed: FEED,
};

export const NAV = [
  { key: "home", label: "Home", href: href.home },
  { key: "writing", label: "Writing", href: href.posts, also: [`${BASE}/tags`] },
  { key: "about", label: "About", href: href.about },
];

export const FOOTER_LINKS = [
  { label: "Writing", href: href.posts },
  { label: "About", href: href.about },
  { label: "RSS feed", href: href.feed },
  { label: "Email", href: `mailto:${AUTHOR.email}` },
  { label: "Code", href: AUTHOR.code },
];

export const NOW = {
  updated: "2026-10-14",
  items: [
    "Moving the last cron jobs at work to systemd timers, one team at a time.",
    "Reading The Design of Everyday Things again, with a pencil this time.",
    "Training for the Ljubljana half marathon in March. Slowly.",
    "Not taking on new side projects until pgdrain 1.0 is out.",
  ],
};

export const PROJECTS = [
  {
    name: "pgdrain",
    href: "https://code.example.org/ines/pgdrain",
    description: "Switches a Postgres primary over with writes paused, not failed.",
    status: "active" as const,
    meta: "Go · MIT · 640 stars",
  },
  {
    name: "unitctl",
    href: "https://code.example.org/ines/unitctl",
    description: "Generates systemd units from a small TOML file and shows the diff before installing.",
    status: "maintained" as const,
    meta: "Go · MIT",
  },
  {
    name: "this site",
    href: "https://code.example.org/ines/site",
    description: "Static HTML, one stylesheet, nothing to install for reading it.",
    status: "active" as const,
    meta: "HTML · CSS · CC BY 4.0",
  },
  {
    name: "tidewatch",
    href: "https://code.example.org/ines/tidewatch",
    description: "A tide-table scraper for the Adriatic. Replaced by the agency's own API.",
    status: "archived" as const,
    meta: "Python · 2019–2022",
  },
];

export const WORK = [
  { when: "2024 – now", what: "Staff engineer, platform team", where: "Northwind Freight, Ljubljana" },
  { when: "2020 – 2024", what: "Senior backend engineer", where: "Kettle & Co., Vienna" },
  { when: "2017 – 2020", what: "Software engineer", where: "Outpost Labs, Zagreb" },
];
