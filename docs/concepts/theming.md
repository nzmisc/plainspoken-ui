# Theming

How people using plainspoken-ui could make it theirs without it stopping being plain: their own
fonts, their own main colour, their choice of gray. See [the concepts README](README.md) for what
the statuses mean.

Written 2026-10-23, from a discussion about setting the library up for public use.

## Summary

| Concept | Status |
|---|---|
| [Corner radius](#corner-radius) | later |
| [Chart colours that stay colour-blind safe](#chart-colours-that-stay-colour-blind-safe) | later |
| [Density](#density) | later |
| [Control heights as a theme setting](#control-heights-as-a-theme-setting) | set aside |
| [Success and warning colours](#success-and-warning-colours) | set aside |
| [Use shadcn/ui's token names](#use-shadcnuis-token-names) | built |
| [Choosable fonts](#choosable-fonts) | built |
| [Main colour, black and white by default](#main-colour-black-and-white-by-default) | built |
| [Choosable base gray](#choosable-base-gray) | built |
| [Link and visited-link colours](#link-and-visited-link-colours) | built |
| [A small theme builder](#a-small-theme-builder) | built |

## Corner radius

**Status: later**

A `--radius` variable that rounds corners when set. To start with, nothing anywhere has a border
radius, and there is no variable for it either. (The theme does set shadcn/ui's `--radius` to
`0rem`, so shadcn/ui components in the same app are square too; plainspoken-ui's own ignore it.)

## Chart colours that stay colour-blind safe

**Status: later**

`chart-1` to `chart-5` chosen so that every pair stays distinguishable for people with the common
kinds of colour blindness, and checked with a tool rather than by eye. The prototype dashboard uses
a checked set (blue, orange, aqua) and draws a second measure of the same thing dashed in its colour
rather than giving it a new colour. If the main colour becomes choosable, the chart colours still
need to pass the check against each other.

## Density

**Status: later**

A theme setting such as compact / regular that scales all the control heights, paddings and text
sizes together, for people who want plainspoken-ui's discipline with a little more room, or even less.

## Control heights as a theme setting

**Status: set aside**

Exposing the control heights (20, 24, 28, 36px) as theme variables people can change one by one.
Set aside for now. (Density, above, is related: the whole scale would move together.)

## Success and warning colours

**Status: set aside**

`success` and `warning` variables next to `destructive`, which shadcn/ui doesn't have. Set aside for
now.

What is set aside is choosing them: the variables exist, with fixed values, because components use
them, and the customizer doesn't offer them.

## Built

### Use shadcn/ui's token names

**Status: built**

Name the theme's CSS variables the way shadcn/ui does: `background`, `foreground`, `card`,
`popover`, `primary`, `primary-foreground`, `secondary`, `muted`, `muted-foreground`, `accent`,
`destructive`, `border`, `input`, `ring`, `chart-1` to `chart-5`. Values in oklch, dark mode
through a `.dark` class, exposed to Tailwind v4 through `@theme inline`.

Why:

- plainspoken-ui and shadcn/ui components can live in the same app under **one** theme. Useful
  because shadcn/ui is still the right tool for some things.
- Themes made for shadcn/ui (by hand, or with tools such as tweakcn) would work on plainspoken-ui as
  they are.
- People who know shadcn/ui know where everything is.

Watch out for:

- shadcn's `muted` is a **background**; muted **text** is `muted-foreground`. A component that
  writes `text-muted` gets light gray text on a light background.
- shadcn projects switch dark mode with the `.dark` class. Colours written with `light-dark()`
  follow the page's `color-scheme` instead and would ignore that class unless the two are tied
  together.

**Built** (2026-10-25): the theme is shadcn/ui's variables, in oklch, with dark mode on a `.dark` class
and an `@theme inline` mapping, plus four of plainspoken-ui's own (`link`, `link-visited`,
`success`, `warning`). One model makes all of it: [lib/theme.ts](../../lib/theme.ts), which writes
[app/theme.css](../../app/theme.css) and the registry's `theme` item. The tokens and what each is for
are on the docs site's Theming page ([source](<../../app/(site)/docs/theming/page.tsx>)).

### Choosable fonts

**Status: built**

Two variables, `--font-sans` and `--font-mono`, which every component uses and nothing hard-codes.
shadcn's registry has a `registry:font` item type, so a font choice can be installed with the
same CLI as the components.

Open question: is the default Geist (as in the prototype this library grew out of), or the
system font stack, with Geist as an option? The system stack costs nothing to load.

**Built** (2026-10-25): every component uses `font-sans` and `font-mono`, and a theme sets
`--font-sans` and `--font-mono` (the `FONTS` list in [lib/theme.ts](../../lib/theme.ts): Geist,
System UI, Inter, IBM Plex Sans, Source Serif 4 and the system serif for text; Geist Mono,
JetBrains Mono, IBM Plex Mono and the system monospace for code). For now the default is Geist,
falling back to the system stack, with System UI one of the choices. Each stack tries a font loader's variable first
(`var(--font-inter, "Inter"), "Inter", ui-sans-serif, …`), and the customizer writes the
`next/font/google` lines that set it. No `registry:font` item: those lines turned out simpler than
another thing to install.

### Main colour, black and white by default

**Status: built**

The one colour that marks primary actions, the selected segment, focus rings and so on (`primary`,
`ring`). By default it is black on white and white on black in dark mode, so a fresh install looks
like plain, unbranded tooling. People who want a colour pick one.

**Built** (2026-10-25): black by default (white in dark mode), ten of Tailwind's colours, or any
hex, which dark mode lifts to a lighter, softer shade. It sets `primary`, `primary-foreground`
(white or black, whichever reads better) and `ring`. `MAIN_COLOURS` and `customMainColour` in
[lib/theme.ts](../../lib/theme.ts).

### Choosable base gray

**Status: built**

The grays used for borders, header rows, muted text and backgrounds, chosen from shadcn's base
colours: neutral, stone, zinc, mauve, olive, mist, taupe. shadcn/ui is MIT licensed, so the exact
values can be reused, with credit.

**Built** (2026-10-25): the seven, as a hue and a chroma measured from shadcn/ui's, applied to
plainspoken-ui's own lightness steps (a plain HTML page's grays), so every base keeps the same
contrast. `BASE_GRAYS` in [lib/theme.ts](../../lib/theme.ts); credited in the site footer.

### Link and visited-link colours

**Status: built**

Variables for links and visited links (`--link`, `--link-visited`). shadcn/ui has neither: its
links are usually styled as text or buttons. A utilitarian UI wants real links that look like
links, and that show which ones you have already visited, the way a plain HTML page does.

**Built** (2026-10-25): `--link` and `--link-visited`, which come with every component (the
`foundation` item) so an existing shadcn/ui theme keeps working. Three choices: the browser's
classic blue and purple (the default), the main colour (visited links a darker, duller shade, kept
at 4.5:1), or a pair of your own. `LINK_COLOURS` in [lib/theme.ts](../../lib/theme.ts).

### A small theme builder

**Status: built**

A page on the docs site, much simpler than shadcn's "create":

- a few choices: base gray, main colour, fonts (and radius, if that ever exists)
- a live preview built from the real components, including dense ones like tables and toolbars
- it produces a CSS block to paste in (`:root`, `.dark` and the `@theme inline` mapping), plus a
  few lines of instructions
- optionally a theme file for the shadcn CLI as well

It runs in the browser. It does not scaffold projects.

**Built** (2026-10-25): the customizer, `/customize` on the docs site
([page](<../../app/(site)/customize/page.tsx>), [components](../../components/site/customizer/)).
Base gray, main colour, link colours and the two fonts on the left; a preview made of the real
components (a toolbar, a table with visited and unvisited links, a form, every button variant, a
control drawn focused) in light or dark on the right; then a WCAG contrast report for both modes
that says in words what fails, the CSS block with where to paste it, the `next/font` lines, and a
share link. The choices live in the address, so a theme is a link. The "theme file for the shadcn
CLI" is a URL that spells out the theme,
`/r/themes/base-stone.main-blue.links-classic.sans-inter.mono-geist-mono.json`, served by
[a route](<../../app/r/themes/[slug]/route.ts>) from the same model, so nothing is stored. It runs
in the browser and scaffolds nothing. No radius choice, since there is no radius.
