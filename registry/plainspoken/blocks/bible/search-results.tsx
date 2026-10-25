import type { ReactNode } from "react";
import { ArrowRight, Search } from "@/registry/plainspoken/lib/icons";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Pagination } from "@/registry/plainspoken/ui/pagination";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { TESTAMENT_NAMES, bibleHref, verseRef, type Testament } from "@/registry/plainspoken/blocks/bible/lib";
import type { BibleSearchHit, BibleSearchResult } from "@/registry/plainspoken/blocks/bible/search";
import { cn } from "@/lib/utils";

export interface BibleSearchResultsProps {
  result: BibleSearchResult;
  /** Where the reader lives: hits link to `${basePath}/${book}/${chapter}#v${verse}` */
  basePath?: string;
  /** The search page's URL, for the filter and page links */
  searchPath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** Shown when there is no query yet: tips, examples */
  intro?: ReactNode;
}

const nf = new Intl.NumberFormat("en-US");

/** The verse with the matched words in <mark> */
function Marked({ hit }: { hit: BibleSearchHit }) {
  const out: ReactNode[] = [];
  let at = 0;
  hit.marks.forEach(([a, b], i) => {
    if (a > at) out.push(hit.text.slice(at, a));
    out.push(
      <mark key={i} className="bg-warning/25 font-semibold text-inherit">
        {hit.text.slice(a, b)}
      </mark>,
    );
    at = b;
  });
  out.push(hit.text.slice(at));
  return <>{out}</>;
}

/**
 * Search results for the Bible, grouped by book: a line saying how many verses matched, a filter
 * by testament with the count for each, the books with matches and their counts (a link narrows
 * the results to one book), the verses with the matched words marked, and pages of 50. When the
 * query reads as a reference ("John 3:16", "ps 23") a link to it comes first. Every filter is a
 * link, so the page works without script and each view has its own URL. Renders on the server.
 */
export function BibleSearchResults({ result: r, basePath = "/bible", searchPath = "/bible/search", linkAs, intro }: BibleSearchResultsProps) {
  const L = linkAs ?? "a";
  const href = (p: { t?: Testament; book?: string; page?: number }) => {
    const s = new URLSearchParams({ q: r.query });
    if (p.t) s.set("t", p.t);
    if (p.book) s.set("book", p.book);
    if (p.page && p.page > 1) s.set("page", String(p.page));
    return `${searchPath}?${s}`;
  };
  const books = new Map(r.books.map((b) => [b.slug, b]));
  const all = r.testaments.OT + r.testaments.NT;
  const quoted = `“${r.query.trim()}”`;

  const reference = r.reference && (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-border bg-muted px-3 py-2">
      <span>That looks like a reference:</span>
      <L
        href={bibleHref(basePath, r.reference.book.slug, r.reference.chapter, r.reference.verse)}
        className={buttonVariants({ variant: "primary", size: "sm" })}
      >
        {r.reference.chapter ? verseRef(r.reference.book, r.reference.chapter, r.reference.verse) : r.reference.book.name}
        <Icon icon={ArrowRight} />
      </L>
    </p>
  );

  if (!r.terms.length) return <div data-slot="bible-search-results">{intro}</div>;

  if (all === 0)
    return (
      <div data-slot="bible-search-results" className="flex flex-col gap-4">
        {reference}
        <EmptyState
          icon={Search}
          bordered
          title={`No verse contains ${quoted}`}
          description="Every word has to be in the same verse. Try fewer words, or the old spelling the King James Version uses (“saith”, “shew”, “sepulchre”)."
        />
      </div>
    );

  const filters: { t?: Testament; label: string; count: number }[] = [
    { label: "Whole Bible", count: all },
    { t: "OT", label: TESTAMENT_NAMES.OT, count: r.testaments.OT },
    { t: "NT", label: TESTAMENT_NAMES.NT, count: r.testaments.NT },
  ];
  const groups: { slug: string; hits: BibleSearchHit[] }[] = [];
  for (const h of r.hits) {
    const last = groups.at(-1);
    if (last?.slug === h.book) last.hits.push(h);
    else groups.push({ slug: h.book, hits: [h] });
  }
  const bookName = r.book ? books.get(r.book)?.name : undefined;

  return (
    <div data-slot="bible-search-results" className="flex flex-col gap-4">
      {reference}
      <p role="status" className="text-[15px]">
        <b className="tabular-nums">{nf.format(r.total)}</b> {r.total === 1 ? "verse contains" : "verses contain"} {quoted}
        {bookName ? ` in ${bookName}` : r.testament ? ` in the ${TESTAMENT_NAMES[r.testament]}` : ""}.
      </p>
      <nav aria-label="Testament" className="flex flex-wrap [&>*+*]:-ml-px">
        {filters.map((f) => {
          const on = f.t === r.testament && !r.book;
          const cls = cn(buttonVariants({ variant: on ? "primary" : "default", size: "sm" }), on && "z-[1]");
          return f.count === 0 ? (
            <span key={f.label} aria-disabled="true" className={cls}>
              {f.label} <span className="tabular-nums opacity-80">0</span>
            </span>
          ) : (
            <L key={f.label} href={href({ t: f.t })} aria-current={on ? "page" : undefined} className={cls}>
              {f.label} <span className="tabular-nums opacity-80">{nf.format(f.count)}</span>
            </L>
          );
        })}
      </nav>
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Books with matches" className="text-[13px] md:sticky md:top-2 md:max-h-[calc(100dvh-1rem)] md:self-start md:overflow-y-auto">
          <h2 className="mb-1 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">By book</h2>
          <ul className="flex flex-wrap gap-x-3 md:block">
            {r.book && (
              <li>
                <L href={href({ t: r.testament })} className={linkVariants()}>
                  All books
                </L>
              </li>
            )}
            {r.books.map((b) => (
              <li key={b.slug} className="flex justify-between gap-2">
                {b.slug === r.book ? (
                  <span aria-current="page" className="font-bold">
                    {b.name}
                  </span>
                ) : (
                  <L href={href({ t: r.testament, book: b.slug })} className={linkVariants()}>
                    {b.name}
                  </L>
                )}
                <span className="text-muted-foreground tabular-nums">{nf.format(b.count)}</span>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          {groups.map((g) => (
            <section key={g.slug} aria-labelledby={`hits-${g.slug}`}>
              <h2 id={`hits-${g.slug}`} className="mb-1 flex items-baseline gap-2 border-b border-border pb-0.5 text-[15px] font-bold">
                {books.get(g.slug)?.name ?? g.slug}
                <span className="text-[13px] font-normal text-muted-foreground">
                  {nf.format(books.get(g.slug)?.count ?? g.hits.length)} {books.get(g.slug)?.count === 1 ? "verse" : "verses"}
                </span>
              </h2>
              <ol className="flex flex-col gap-1.5">
                {g.hits.map((h) => {
                  const b = { slug: h.book, name: books.get(h.book)?.name ?? h.book };
                  return (
                    <li key={`${h.chapter}:${h.verse}`} className="max-w-[80ch] leading-relaxed">
                      <L href={bibleHref(basePath, h.book, h.chapter, h.verse)} className={cn(linkVariants(), "mr-2 font-semibold whitespace-nowrap")}>
                        {verseRef(b, h.chapter, h.verse)}
                      </L>
                      <Marked hit={h} />
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {r.pageCount > 1 && (
            <Pagination
              page={r.page}
              pageCount={r.pageCount}
              href={(p) => href({ t: r.testament, book: r.book, page: p })}
              linkAs={linkAs}
              total={r.total}
              pageSize={r.pageSize}
              label="Result pages"
            />
          )}
        </div>
      </div>
    </div>
  );
}
