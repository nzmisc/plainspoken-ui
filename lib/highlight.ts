import { cacheLife } from "next/cache";
import { codeToHtml } from "shiki";

/** Syntax-highlighted HTML with both a light and a dark colour per token (see .shiki in globals.css). Cached: it runs at build time. */
export async function highlight(code: string, lang: string = "tsx"): Promise<string> {
  "use cache";
  cacheLife("max");
  return codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
}
