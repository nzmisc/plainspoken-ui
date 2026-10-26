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
  { slug: "chat", title: "AI chat", summary: "Parley, a working chat with language models through OpenRouter: files and pictures, documents and code written beside the chat (with versions, suggestions and Run), the weather, branches, two models compared, saved prompts, share links and export, all kept in the browser.", shows: "Streamed Markdown and code, a document panel with versions and diffs, an editable sheet, a code sandbox, tool cards, attachments, branch pickers, a compare view, a prompt library, toasts" },
  { slug: "kanban", title: "Kanban", summary: "Corkboard, a team's task board: drag cards between columns with a mouse, a finger or the keyboard, filter them, and open one for its checklist, files, comments and activity.", shows: "Drag and drop, work-in-progress limits, round avatars and facepiles, a card dialog, file upload, @mentions" },
  { slug: "editor", title: "Editor", summary: "Quire, a team handbook: pages and drafts in a sidebar, and a rich text editor in three modes (formatted, raw Markdown, preview) with pictures and Markdown shortcuts.", shows: "A rich text editor, a Markdown source view, picture uploads, a keyboard toolbar, autosave" },
  { slug: "milkdown", title: "Editor (Milkdown)", summary: "Pennant's engineering notebook, on an editor built on Milkdown: RFCs, runbooks, incident reviews and on-call notes in a page tree with search, each with an outline that follows the reading.", shows: "A slash menu, draggable block handles, tables, code, math and footnotes, page templates, an outline" },
  { slug: "grid", title: "Data grid", summary: "An online shop's three thousand orders in one table: saved views, Excel-style filters on every column, sorting by several, columns to show, hide and resize, totals, an order drawer, and export to the clipboard, Excel and CSV.", shows: "The data table at full stretch: column filters, multi-column sort, resizing, windowed rows, export, a drawer" },
  { slug: "budget", title: "Budget", summary: "A team's yearly budget in an editable table: type into cells, paste from a spreadsheet, undo, and watch the totals follow.", shows: "An editable table with keyboard navigation, validation, copy and paste, undo" },
  { slug: "conflicts", title: "Edit conflicts", summary: "Prototypes of what to show when two people change the same text at once, for a text box and for a rich text editor.", shows: "Presence, live changes, diffs, three-way merges, conflict dialogs" },
  { slug: "erd", title: "ERD", summary: "An entity-relationship diagram of a database: pan and zoom, drag tables around, follow foreign keys, edit the schema and export SQL.", shows: "A pannable canvas, draggable nodes, crow's-foot relationship lines, a minimap, panels and menus" },
];
