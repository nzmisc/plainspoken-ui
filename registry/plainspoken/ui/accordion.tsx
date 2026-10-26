import { Children, cloneElement, isValidElement, useId, type DetailsHTMLAttributes, type ReactElement, type ReactNode } from "react";
import { ChevronRight } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  id: string;
  title: ReactNode;
  /** Muted text at the right of the header: a count, a status */
  meta?: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  /** The sections, as data. Or write AccordionItem children. */
  items?: AccordionItemData[];
  /** Only one open at a time: opening one closes the others (the native `name` attribute on <details>) */
  exclusive?: boolean;
  /** Ids of the items open at first (with `items`) */
  defaultOpen?: string[];
  className?: string;
  children?: ReactNode;
}

/**
 * Stacked sections that open and close, in one bordered box. Plain <details> and <summary>:
 * keyboard, screen readers and find-in-page (which opens a closed section to show a match) work
 * with no script at all, so it renders on the server. `exclusive` uses the native `name`
 * attribute, so the browser closes the others.
 */
export function Accordion({ items, exclusive = false, defaultOpen = [], className, children }: AccordionProps) {
  const name = useId();
  const group = exclusive ? name : undefined;
  return (
    <div data-slot="accordion" className={cn("min-w-0 border border-border [&>*+*]:border-t [&>*+*]:border-border", className)}>
      {items?.map((it) => (
        <AccordionItem key={it.id} name={group} title={it.title} meta={it.meta} defaultOpen={defaultOpen.includes(it.id)}>
          {it.content}
        </AccordionItem>
      ))}
      {Children.map(children, (child) =>
        group && isValidElement(child) && child.type === AccordionItem
          ? cloneElement(child as ReactElement<AccordionItemProps>, { name: group })
          : child,
      )}
    </div>
  );
}

export interface AccordionItemProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "title" | "open"> {
  title: ReactNode;
  /** Muted text at the right of the header: a count, a status */
  meta?: ReactNode;
  /** Open at first. The reader opens and closes it from then on (listen with onToggle). */
  defaultOpen?: boolean;
}

/** One section: a <details> whose <summary> is the header row. Use inside Accordion, or alone. */
export function AccordionItem({ title, meta, defaultOpen = false, className, children, ...rest }: AccordionItemProps) {
  return (
    <details data-slot="accordion-item" open={defaultOpen} className={cn("group/acc min-w-0", className)} {...rest}>
      <summary
        className={cn(
          "flex min-h-(--ctl-h) cursor-pointer list-none items-center gap-2 bg-muted px-3 py-1 select-none hover:bg-accent [&::-webkit-details-marker]:hidden",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        )}
      >
        <Icon
          icon={ChevronRight}
          className="text-muted-foreground transition-transform group-open/acc:rotate-90 motion-reduce:transition-none"
        />
        <span className="min-w-0 flex-1 font-semibold">{title}</span>
        {meta != null && <span className="shrink-0 text-[13px] text-muted-foreground">{meta}</span>}
      </summary>
      <div className="border-t border-border px-3 py-2">{children}</div>
    </details>
  );
}
