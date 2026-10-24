// A customized theme as a shadcn registry item: /r/themes/<slug>.json, where the slug spells out
// the theme's options (themeSlug in lib/theme.ts), e.g.
//   /r/themes/base-stone.main-blue.links-classic.sans-inter.mono-geist-mono.json
// The customizer at /customize writes these URLs. The default theme is the static /r/theme.json.
import { buildTheme, fontVar, oklchToHex, themeFromSlug, themeRegistryItem, type ThemeOptions } from "@/lib/theme";

const CORS = { "Access-Control-Allow-Origin": "*" };

/** "Stone grays, a blue main colour, classic blue and purple links, Inter and Geist Mono." */
function describe(o: ThemeOptions): string {
  const main = o.main.id === "custom" && o.main.light ? oklchToHex(o.main.light) : o.main.label.toLowerCase();
  const links = { custom: "custom link colours", main: "links in the main colour" }[o.links.id] ?? "classic blue and purple links";
  return `${o.base.label} grays, a ${main} main colour, ${links}, ${o.sans.label} and ${o.mono.label}.`;
}

export async function GET(_request: Request, ctx: RouteContext<"/r/themes/[slug]">) {
  const { slug: file } = await ctx.params;
  const options = file.endsWith(".json") ? themeFromSlug(file.slice(0, -".json".length)) : null;
  if (!options)
    return Response.json(
      {
        error: `No theme called ${file}. Theme URLs look like /r/themes/base-stone.main-blue.links-classic.sans-inter.mono-geist-mono.json; the customizer at /customize makes them.`,
      },
      { status: 404, headers: CORS },
    );
  const item = themeRegistryItem(buildTheme(options), "theme", "plainspoken-ui theme", {
    description: `A plainspoken-ui theme: ${describe(options)}`,
    fontVars: { sans: fontVar(options.sans), mono: fontVar(options.mono) },
  });
  return new Response(JSON.stringify(item, null, 2) + "\n", {
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      // The same URL always gives the same JSON (until lib/theme.ts changes)
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
