import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const KEY = "inline-block min-w-[1.7em] border border-b-2 border-border bg-muted px-[0.35em] text-center font-mono text-[0.85em] leading-[1.35] font-normal whitespace-nowrap text-foreground";

export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** A combination, one key per entry: `["⌘", "K"]`, `["Ctrl", "Shift", "C"]`. Drawn with "+" between them. */
  keys?: string[];
  /** A single key, when `keys` is left out */
  children?: ReactNode;
}

/**
 * A key or a key combination, for shortcuts in help text and menus: `<Kbd keys={["⌘", "K"]} />`
 * or `<Kbd>Esc</Kbd>`. Each key is its own <kbd> with a thicker bottom edge, like a keycap; a
 * combination is a <kbd> of <kbd>s, which is how HTML marks up "press these together". Sizes
 * itself from the text around it.
 */
export function Kbd({ keys, children, className, ...rest }: KbdProps) {
  if (!keys)
    return (
      <kbd data-slot="kbd" className={cn(KEY, className)} {...rest}>
        {children}
      </kbd>
    );
  return (
    <kbd data-slot="kbd" className={cn("inline-flex items-baseline gap-[0.2em] font-sans", className)} {...rest}>
      {keys.map((k, i) => (
        <span key={i} className="inline-flex items-baseline gap-[0.2em]">
          {i > 0 && (
            // The surrounding text colour, dimmed: stays readable on a highlighted menu row
            <span aria-hidden className="opacity-60">
              +
            </span>
          )}
          <kbd className={KEY}>{k}</kbd>
        </span>
      ))}
    </kbd>
  );
}
