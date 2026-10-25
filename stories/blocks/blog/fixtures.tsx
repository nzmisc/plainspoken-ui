// Shared by the blog stories: post bodies with their code blocks drawn plain (the site highlights
// them on the server, which Storybook can't do).
import { BlogCode } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { CodeProps } from "@/content/blog/types";

export function PlainCode({ lang, title, children }: CodeProps) {
  return <BlogCode code={children.trimEnd()} lang={lang} title={title} />;
}
