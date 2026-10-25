import { highlight } from "@/lib/highlight";
import { BlogCode } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { CodeProps } from "@/content/blog/types";

/** A post's code block, highlighted on the server with shiki (light and dark colours in one pass). */
export async function HighlightedCode({ lang, title, children }: CodeProps) {
  const code = children.trimEnd();
  const html = await highlight(code, lang);
  return <BlogCode code={code} lang={lang} title={title} html={html} />;
}
