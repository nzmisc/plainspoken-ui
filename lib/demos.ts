// The demo apps, for the demos index, the home page and the bar above each demo.

export interface Demo {
  slug: string;
  title: string;
  /** One line: what it is */
  summary: string;
  /** What it shows off */
  shows: string;
}

export const DEMOS: Demo[] = [
  { slug: "mail", title: "Mail", summary: "An email client: folders and labels, a message list with search and filters, threads in a reading pane, and compose.", shows: "Resizable panes, app shell, lists, chips, menus, hover cards, dialogs" },
  { slug: "app", title: "App skeleton", summary: "The frame for a web app, as an invoicing tool: dashboard, customers, projects, invoices and settings, with a ⌘K palette.", shows: "App shell, command palette, charts, data table, drawer, tabs, forms" },
  { slug: "music", title: "Music", summary: "Turntable, a music player: home, search, your library, albums, playlists and artists, with a player bar that keeps playing across pages.", shows: "Player controls, sliders, toggles, track tables, cards and shelves, drawers, context menus" },
  { slug: "social", title: "Social", summary: "Murmur, a microblog: timeline, composer, threads, profiles, explore and notifications.", shows: "Feeds, hover cards, avatars, tabs, polls, menus, a composer with a character count" },
  { slug: "blog", title: "Blog", summary: "A developer's personal site: eleven posts with code, figures and footnotes, an archive by year, tags, an about page and a feed.", shows: "Prose, tables of contents, highlighted code, post lists, breadcrumbs" },
  { slug: "landing", title: "Landing page", summary: "The marketing site of an uptime monitor: hero, features, pricing with a comparison table, FAQ and sign-up.", shows: "A product shot made of components, pricing cards, tables, accordions, forms" },
  { slug: "library", title: "Library", summary: "A public library catalogue: search with facets, book pages, holds and loans.", shows: "Search with facets, result lists, a hold dialog, account tables, calendars" },
  { slug: "bible", title: "Bible", summary: "A Bible reader: every book and chapter of the King James Version, with search.", shows: "Long-form reading, verse navigation, reader settings, search" },
];
