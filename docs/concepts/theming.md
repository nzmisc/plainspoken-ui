# Theming

How people using austere-ui could make it theirs without it stopping being austere: their own
fonts, their own main colour, their choice of gray. See [the concepts README](README.md) for what
the statuses mean.

Written 2026-10-23, from a discussion about setting the library up for public use.

## Summary

| Concept | Status |
|---|---|
| [Use shadcn/ui's token names](#use-shadcnuis-token-names) | open |
| [Choosable fonts](#choosable-fonts) | wanted |
| [Main colour, black and white by default](#main-colour-black-and-white-by-default) | wanted |
| [Choosable base gray](#choosable-base-gray) | wanted |
| [Link and visited-link colours](#link-and-visited-link-colours) | wanted |
| [A small theme builder](#a-small-theme-builder) | wanted |
| [Corner radius](#corner-radius) | later |
| [Chart colours that stay colour-blind safe](#chart-colours-that-stay-colour-blind-safe) | later |
| [Density](#density) | later |
| [Control heights as a theme setting](#control-heights-as-a-theme-setting) | set aside |
| [Success and warning colours](#success-and-warning-colours) | set aside |

## Use shadcn/ui's token names

**Status: open**

Name the theme's CSS variables the way shadcn/ui does: `background`, `foreground`, `card`,
`popover`, `primary`, `primary-foreground`, `secondary`, `muted`, `muted-foreground`, `accent`,
`destructive`, `border`, `input`, `ring`, `chart-1` to `chart-5`. Values in oklch, dark mode
through a `.dark` class, exposed to Tailwind v4 through `@theme inline`.

Why:

- austere-ui and shadcn/ui components can live in the same app under **one** theme. Useful
  because shadcn/ui is still the right tool for some things.
- Themes made for shadcn/ui (by hand, or with tools such as tweakcn) would work on austere-ui as
  they are.
- People who know shadcn/ui know where everything is.

Watch out for:

- shadcn's `muted` is a **background**; muted **text** is `muted-foreground`. A component that
  writes `text-muted` gets light gray text on a light background.
- shadcn projects switch dark mode with the `.dark` class. Colours written with `light-dark()`
  follow the page's `color-scheme` instead and would ignore that class unless the two are tied
  together.

## Choosable fonts

**Status: wanted**

Two variables, `--font-sans` and `--font-mono`, which every component uses and nothing hard-codes.
shadcn's registry has a `registry:font` item type, so a font choice can be installed with the
same CLI as the components.

Open question: is the default Geist (as in the prototype this library grew out of), or the
system font stack, with Geist as an option? The system stack costs nothing to load.

## Main colour, black and white by default

**Status: wanted**

The one colour that marks primary actions, the selected segment, focus rings and so on (`primary`,
`ring`). By default it is black on white and white on black in dark mode, so a fresh install looks
like plain, unbranded tooling. People who want a colour pick one.

## Choosable base gray

**Status: wanted**

The grays used for borders, header rows, muted text and backgrounds, chosen from shadcn's base
colours: neutral, stone, zinc, mauve, olive, mist, taupe. shadcn/ui is MIT licensed, so the exact
values can be reused, with credit.

## Link and visited-link colours

**Status: wanted**

Variables for links and visited links (`--link`, `--link-visited`). shadcn/ui has neither: its
links are usually styled as text or buttons. A utilitarian UI wants real links that look like
links, and that show which ones you have already visited, the way a plain HTML page does.

## A small theme builder

**Status: wanted**

A page on the docs site, much simpler than shadcn's "create":

- a few choices: base gray, main colour, fonts (and radius, if that ever exists)
- a live preview built from the real components, including dense ones like tables and toolbars
- it produces a CSS block to paste in (`:root`, `.dark` and the `@theme inline` mapping), plus a
  few lines of instructions
- optionally a theme file for the shadcn CLI as well

It runs in the browser. It does not scaffold projects.

## Corner radius

**Status: later**

A `--radius` variable that rounds corners when set. To start with, nothing anywhere has a border
radius, and there is no variable for it either.

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
sizes together, for people who want austere-ui's discipline with a little more room, or even less.

## Control heights as a theme setting

**Status: set aside**

Exposing the control heights (20, 24, 28, 36px) as theme variables people can change one by one.
Set aside for now. (Density, above, is related: the whole scale would move together.)

## Success and warning colours

**Status: set aside**

`success` and `warning` variables next to `destructive`, which shadcn/ui doesn't have. Set aside for
now.
