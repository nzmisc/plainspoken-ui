import type { ComponentType, ReactNode } from "react";
import type { BlogArticleSection } from "@/registry/plainspoken/blocks/blog/article";

/** A code block in a post. The site highlights it on the server; Storybook shows it plain. */
export interface CodeProps {
  lang: string;
  /** A file name or a few words above the code */
  title?: string;
  children: string;
}

/** What a post's body is written with, handed in by whoever renders it. */
export interface PostParts {
  Code: ComponentType<CodeProps>;
}

export interface PostBody {
  /** Before the first heading */
  intro: ReactNode;
  sections: BlogArticleSection[];
  footnotes?: ReactNode[];
}

export interface Post {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  updated?: string;
  /** One or two sentences: the standfirst, the list summary and the meta description */
  summary: string;
  tags: string[];
  /** Reading time in minutes, at about 200 words a minute, code counted as half */
  minutes: number;
  body: (parts: PostParts) => PostBody;
}
