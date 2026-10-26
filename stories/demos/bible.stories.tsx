import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import descriptions from "@/content/bible/descriptions.json";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { BibleBookIntro } from "@/registry/plainspoken/blocks/bible/book-intro";
import { BibleBookList } from "@/registry/plainspoken/blocks/bible/book-list";
import { BibleChapter } from "@/registry/plainspoken/blocks/bible/chapter";
import { BibleChapterGrid } from "@/registry/plainspoken/blocks/bible/chapter-grid";
import { BibleChapterPager } from "@/registry/plainspoken/blocks/bible/chapter-pager";
import { BibleHeader } from "@/registry/plainspoken/blocks/bible/header";
import { BibleJump } from "@/registry/plainspoken/blocks/bible/jump";
import { BibleReaderSettings } from "@/registry/plainspoken/blocks/bible/reader-settings";
import { searchBible } from "@/registry/plainspoken/blocks/bible/search";
import { BibleSearchForm } from "@/registry/plainspoken/blocks/bible/search-form";
import { BibleSearchResults } from "@/registry/plainspoken/blocks/bible/search-results";
import { BASE, BOOKS, JOHN, RUTH } from "../blocks/bible/fixtures";

/** The demo's frame: the bar, a centred column, the footer */
function Frame({ path, children }: { path: string; children: ReactNode }) {
  return (
    <>
      <BibleHeader basePath={BASE} pathname={path} />
      <main className="mx-auto w-full max-w-5xl px-3 pt-4 pb-10 sm:px-6 sm:pt-6">{children}</main>
    </>
  );
}

const meta: Meta = {
  title: "Demos/Bible",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

/** The contents: search, and all 66 books by testament and section. */
export const Books: Story = {
  render: () => (
    <Frame path={BASE}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div>
            <h1 className="text-[28px] leading-tight font-bold">The Holy Bible</h1>
            <p className="text-muted-foreground">King James Version · 66 books · 1,189 chapters · 31,102 verses</p>
          </div>
          <BibleSearchForm action={`${BASE}/search`} />
        </header>
        <BibleBookList books={BOOKS} basePath={BASE} />
      </div>
    </Frame>
  ),
};

/** A book's page: what it is, and its chapters. */
export const Book: Story = {
  render: () => (
    <Frame path={`${BASE}/ruth`}>
      <div className="flex flex-col gap-5">
        <Breadcrumb items={[{ label: "Bible", href: BASE }, { label: "Ruth" }]} />
        <BibleBookIntro book={RUTH.book} description={(descriptions as Record<string, string>).ruth} basePath={BASE} />
        <h2 className="text-[16px] font-bold">Chapters</h2>
        <BibleChapterGrid book={RUTH.book} basePath={BASE} />
      </div>
    </Frame>
  ),
};

/** Reading John 3: jump to any chapter, change the display, page with ← and →. */
export const Chapter: Story = {
  render: () => (
    <Frame path={`${BASE}/john/3`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Breadcrumb items={[{ label: "Bible", href: BASE }, { label: "John", href: `${BASE}/john` }, { label: "Chapter 3" }]} />
          <div className="ctl-sm flex flex-wrap items-center gap-1.5">
            <BibleJump books={BOOKS} book="john" chapter={3} basePath={BASE} />
            <BibleReaderSettings />
          </div>
        </div>
        <BibleChapter book={JOHN.book} chapter={3} text={JOHN.chapters[2]} />
        <BibleChapterPager
          prev={{ slug: "john", name: "John", chapter: 2 }}
          next={{ slug: "john", name: "John", chapter: 4 }}
          basePath={BASE}
          className="max-w-[68ch] border-t border-border pt-4"
        />
      </div>
    </Frame>
  ),
};

/** Search results (here over Ruth and John only): by testament, by book, matches marked. */
export const Search: Story = {
  render: () => (
    <Frame path={`${BASE}/search`}>
      <div className="flex flex-col gap-4">
        <h1 className="text-[24px] leading-tight font-bold">Search the Bible</h1>
        <BibleSearchForm action={`${BASE}/search`} defaultValue="believe" />
        <BibleSearchResults result={searchBible([RUTH, JOHN], "believe")} basePath={BASE} searchPath={`${BASE}/search`} />
      </div>
    </Frame>
  ),
};

/** The chapter on a phone. */
export const ChapterOnAPhone: Story = { ...Chapter, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
