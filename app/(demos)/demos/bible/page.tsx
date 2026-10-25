import type { Metadata } from "next";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";
import { BibleBookList } from "@/registry/plainspoken/blocks/bible/book-list";
import { BibleSearchForm } from "@/registry/plainspoken/blocks/bible/search-form";
import { BASE, BOOKS, SEARCH } from "./data";

export const metadata: Metadata = {
  title: { absolute: "The Holy Bible: King James Version" },
  description: "Read the King James Bible online: all 66 books of the Old and New Testaments, chapter by chapter, with full-text search.",
  alternates: { canonical: BASE },
};

export default function BibleHome() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-bold">The Holy Bible</h1>
          <p className="text-muted-foreground">King James Version · 66 books · 1,189 chapters · 31,102 verses</p>
        </div>
        <BibleSearchForm action={SEARCH} />
      </header>
      <BibleBookList books={BOOKS} basePath={BASE} linkAs={Link} />
    </div>
  );
}
