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
  { slug: "mail", title: "Mail", summary: "An email client: folders, a message list, reading pane and compose.", shows: "Resizable panes, lists, toolbars, menus, dialogs" },
  { slug: "app", title: "App skeleton", summary: "The frame for a web app: sidebar, header, settings, a dashboard and a command palette.", shows: "App shell, sidebar, forms, data table, charts" },
  { slug: "music", title: "Music", summary: "A music player in the style of Spotify: library, playlists, albums and a player bar.", shows: "Player controls, sliders, track tables, artwork grids" },
  { slug: "social", title: "Social", summary: "A microblog in the style of Twitter: timeline, composer, profiles and threads.", shows: "Feeds, avatars, tabs, composer, counters" },
  { slug: "blog", title: "Blog", summary: "A personal website with a blog: posts, tags, an about page and an archive.", shows: "Prose typography, navigation, lists of writing" },
  { slug: "landing", title: "Landing page", summary: "A startup's marketing page: hero, features, pricing, testimonials, FAQ.", shows: "Marketing sections, pricing tables, accordions, calls to action" },
  { slug: "library", title: "Library", summary: "A public library catalogue: search with facets, book pages, holds and loans.", shows: "Search, filters, result lists, detail pages, account tables" },
  { slug: "bible", title: "Bible", summary: "A Bible reader: every book and chapter of the King James Version, with search.", shows: "Long-form reading, verse navigation, reader settings, search" },
];
