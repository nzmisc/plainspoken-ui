"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { controlSize } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Select } from "@/registry/plainspoken/ui/select";
import { TESTAMENT_NAMES, bibleHref, type BibleBook } from "@/registry/plainspoken/blocks/bible/lib";
import { cn } from "@/lib/utils";

export interface BibleJumpProps {
  /** Every book, in order, with its number of chapters */
  books: Pick<BibleBook, "slug" | "name" | "testament" | "chapters">[];
  /** Where the reader is now: the selects start here */
  book: string;
  chapter: number;
  basePath?: string;
  size?: ControlSize;
  className?: string;
}

/**
 * Go to any chapter: a book select (grouped by testament), a chapter select and a Go button. The
 * selects only choose; nothing happens until Go (or Enter on it), so arrowing through a closed
 * select doesn't load a page per step. Choosing a book with fewer chapters than the one picked
 * resets the chapter to 1.
 */
export function BibleJump({ books, book, chapter, basePath = "/bible", size, className }: BibleJumpProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(book);
  const [n, setN] = useState(chapter);
  const current = books.find((b) => b.slug === slug) ?? books[0];
  return (
    <form
      data-slot="bible-jump"
      aria-label="Go to a chapter"
      className={cn("flex flex-wrap items-center gap-1.5", controlSize(size), className)}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(bibleHref(basePath, slug, n));
      }}
    >
      <Select
        aria-label="Book"
        value={slug}
        onChange={(e) => {
          const b = books.find((x) => x.slug === e.target.value);
          setSlug(e.target.value);
          if (b && n > b.chapters) setN(1);
        }}
        options={(["OT", "NT"] as const).map((t) => ({
          group: TESTAMENT_NAMES[t],
          options: books.filter((b) => b.testament === t).map((b) => ({ value: b.slug, label: b.name })),
        }))}
      />
      <Select
        aria-label="Chapter"
        value={String(n)}
        onChange={(e) => setN(Number(e.target.value))}
        options={Array.from({ length: current.chapters }, (_, i) => ({ value: String(i + 1), label: `Chapter ${i + 1}` }))}
      />
      <Button type="submit">Go</Button>
    </form>
  );
}
