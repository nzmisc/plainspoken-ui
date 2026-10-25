# plainspoken-ui

Plain, dense, accessible React components: square corners, gray buttons with borders, tables with lines, and links
that are blue until you've visited them. Every control sits on one height scale (20, 24, 28, 36px), so anything you put
side by side lines up.

It is a [shadcn registry](https://ui.shadcn.com/docs/registry), not an npm package: you copy the components you want
into your project with the shadcn CLI, and they are your code from then on.

```sh
npx shadcn@latest add https://<site>/r/button.json
```

- **Docs and demos**: the Next.js site in this repo (`app/`): every component with examples and install commands, eight
  demo apps built only from these components, and a theme customizer.
- **Storybook**: every component, state and size, at `/storybook/` on the same site.
- **Registry**: `registry/items/*.json` describe the items; `scripts/build-registry.ts` turns them into `public/r/*.json`.

## Develop

```sh
npm install
npm run dev          # the site on http://localhost:3000
npm run storybook    # Storybook on http://127.0.0.1:6106
npm run build        # registry, Storybook into public/storybook, then the site
```

Both dev servers only answer to localhost. To reach them by another name (a tunnel, a tailnet name), list it in
`.env.local`: `DEV_HOSTS=dev-box.example.ts.net`. For production builds served elsewhere, set `NEXT_PUBLIC_SITE_URL`
so install commands and registry links point there.

How the code is organised and the rules every component follows are in [AGENTS.md](AGENTS.md). Design notes are in
[docs/concepts](docs/concepts/README.md).

## Credits

- Icons: [Lucide](https://lucide.dev) (ISC), copied in as data; see `registry/plainspoken/lib/LICENSE-lucide.txt`.
- Token names and base grays: [shadcn/ui](https://ui.shadcn.com) (MIT).
- Fonts: [Geist](https://vercel.com/font) (SIL Open Font License), in `app/fonts`.

## License

MIT
