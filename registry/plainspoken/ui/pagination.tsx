import { Fragment, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { Button, buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

/** Page numbers to show: always the first and the last, and `siblings` either side of the current one, with gaps between. */
export function pageList(page: number, pages: number, siblings = 1): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  const from = Math.max(2, page - siblings);
  const to = Math.min(pages - 1, page + siblings);
  out.push(1);
  // A gap of one page shows that page instead: "1 2 3" beats "1 … 3"
  if (from > 2) out.push(from === 3 ? 2 : "gap");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < pages - 1) out.push(to === pages - 2 ? pages - 1 : "gap");
  if (pages > 1) out.push(pages);
  return out;
}

export interface PaginationProps {
  /** The current page, counting from 1 */
  page: number;
  pageCount: number;
  /** Buttons that call this (for a list in client state) ... */
  onChange?: (page: number) => void;
  /** ... or links to each page's URL (for pages a search engine should find): `(p) => "?page=" + p` */
  href?: (page: number) => string;
  /**
   * The component to draw `href` links with. Default: a plain <a>. With Next.js pass `NextLink`
   * from `@/lib/next-link` (the next-link item), which works from server and client components
   * alike; next/link's own `Link` only works when the caller is a client component.
   */
  linkAs?: LinkComponent;
  /** Total rows and rows per page: adds "26–50 of 340" */
  total?: number;
  pageSize?: number;
  /** Offer a rows-per-page picker with these sizes (needs onPageSizeChange) */
  pageSizes?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Just "‹ 3 / 14 ›", for tight spaces */
  compact?: boolean;
  /** Numbers shown either side of the current page. Default 1. */
  siblings?: number;
  /** Control height. Default sm (24px), the size for a table's footer. */
  size?: ControlSize;
  /** Accessible name of the navigation landmark. Default "Pagination". */
  label?: string;
  className?: string;
}

/**
 * Page navigation for long lists: Previous, page numbers, Next, and optionally "26–50 of 340" and
 * a rows-per-page picker. Numbers collapse with "…" so it stays one short line; on phones they
 * drop away and only Previous, Next and "Page 7 of 14" remain. Every part is a control of one
 * size, butted together, so the strip is one even band. Works with buttons (`onChange`) or with
 * links (`href`), so a server-rendered list can be paged without JavaScript.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  href,
  linkAs: LinkAs,
  total,
  pageSize,
  pageSizes,
  onPageSizeChange,
  compact = false,
  siblings = 1,
  size = "sm",
  label = "Pagination",
  className,
}: PaginationProps) {
  const clampPage = (p: number) => Math.min(pageCount, Math.max(1, p));
  const range =
    total != null && pageSize ? `${total === 0 ? 0 : (page - 1) * pageSize + 1}–${Math.min(total, page * pageSize)} of ${total}` : null;
  const box = "inline-flex h-(--ctl-h) items-center border border-input px-(--ctl-px) text-(length:--ctl-text) whitespace-nowrap tabular-nums";

  /** A page control: a link when there is `href`, else a button */
  const control = (opts: {
    to: number;
    disabled?: boolean;
    current?: boolean;
    aria: string;
    className?: string;
    square?: boolean;
    children: ReactNode;
  }) => {
    const variant = opts.current ? "primary" : "default";
    if (href) {
      const cls = cn(buttonVariants({ variant, square: opts.square }), opts.current && "z-[1]", opts.className);
      if (opts.disabled)
        return (
          <span aria-disabled="true" aria-label={opts.aria} className={cls}>
            {opts.children}
          </span>
        );
      const props = { href: href(opts.to), className: cls, "aria-label": opts.aria, "aria-current": opts.current ? ("page" as const) : undefined };
      return LinkAs ? <LinkAs {...props}>{opts.children}</LinkAs> : <a {...props}>{opts.children}</a>;
    }
    return (
      <Button
        variant={variant}
        disabled={opts.disabled}
        aria-label={opts.aria}
        aria-current={opts.current ? "page" : undefined}
        onClick={() => onChange?.(clampPage(opts.to))}
        className={cn(opts.square && "size-(--ctl-h) px-0", opts.current && "z-[1]", opts.className)}
      >
        {opts.children}
      </Button>
    );
  };

  // Previous and next: icon only when compact or on phones, with the word too on wider screens
  const edge = (dir: -1 | 1) => {
    const aria = dir < 0 ? "Previous page" : "Next page";
    const disabled = dir < 0 ? page <= 1 : page >= pageCount;
    const icon = <Icon icon={dir < 0 ? ChevronLeft : ChevronRight} />;
    return (
      <>
        {control({ to: page + dir, disabled, aria, square: true, className: compact ? undefined : "sm:hidden", children: icon })}
        {!compact &&
          control({
            to: page + dir,
            disabled,
            aria,
            className: "hidden sm:inline-flex",
            children: dir < 0 ? <>{icon} Previous</> : <>Next {icon}</>,
          })}
      </>
    );
  };

  return (
    <nav
      aria-label={label}
      data-slot="pagination"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-(length:--ctl-text)", controlSize(size), className)}
    >
      <div className="flex items-center [&>*+*]:-ml-px [&>*:focus-visible]:z-10">
        {edge(-1)}
        {compact ? (
          <span className={box}>
            {page} / {pageCount}
          </span>
        ) : (
          <>
            {pageList(page, pageCount, siblings).map((p, i) =>
              p === "gap" ? (
                <span key={`gap${i}`} aria-hidden className={cn(box, "hidden text-muted-foreground sm:inline-flex")}>
                  …
                </span>
              ) : (
                <Fragment key={p}>
                  {control({ to: p, current: p === page, aria: `Page ${p}`, className: "hidden min-w-[3.5ch] tabular-nums sm:inline-flex", children: p })}
                </Fragment>
              ),
            )}
            <span className={cn(box, "sm:hidden")}>
              Page {page} of {pageCount}
            </span>
          </>
        )}
        {edge(1)}
      </div>
      {range && <span className="text-muted-foreground tabular-nums">{range}</span>}
      {pageSizes && onPageSizeChange && (
        <label className="flex items-center gap-1.5 text-muted-foreground">
          Rows per page
          <Select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={pageSizes.map(String)}
            className="text-foreground"
          />
        </label>
      )}
    </nav>
  );
}
