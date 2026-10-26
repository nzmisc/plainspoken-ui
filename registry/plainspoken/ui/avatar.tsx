"use client";

import { Children, cloneElement, isValidElement, useId, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { Search } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Input } from "@/registry/plainspoken/ui/input";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { cn } from "@/lib/utils";

const COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

/** First letters of the first and last word: "Ada Lovelace" → "AL", "ops" → "O", "ops@example.com" → "OE". */
export function initials(name: string): string {
  const w = name.trim().split(/[\s._@-]+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w.length > 1 ? w.at(-1)![0] : "")).toUpperCase();
}

/** Same name, same colour, picked from the chart colours */
function colorFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

/** Square (the default, like everything else here) or a circle */
export type AvatarShape = "square" | "circle";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Who or what it stands for. The accessible name and the hover text, and where the initials come from. */
  name: string;
  /** Picture URL. While it loads, and if it fails, the initials show. */
  src?: string;
  /** Width and height in px. Default 28, a control's height, so it lines up with buttons in a row. */
  size?: number;
  /** "circle" is the one round thing in the library, for apps where people are round by custom. Default "square". */
  shape?: AvatarShape;
  /**
   * A line under the name in an AvatarGroup's list of everyone: a role, "commented 2 h ago". Not
   * shown on the avatar itself.
   */
  detail?: ReactNode;
}

/**
 * A square or round picture, or initials on a colour, standing for a person or a machine. The
 * colour comes from the name (the same name always gets the same one), from the chart colours.
 * The picture sits over the initials, so there is never an empty box: while it loads or if it
 * fails to load, the initials show.
 */
export function Avatar({
  name,
  src,
  size = 28,
  shape = "square",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- read by AvatarGroup, kept off the <span>
  detail,
  className,
  style,
  ...rest
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      data-slot="avatar"
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-border align-middle leading-none font-bold text-background select-none",
        shape === "circle" && "rounded-full",
        colorFor(name),
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.4)), ...style }}
      {...rest}
    >
      <span aria-hidden>{initials(name)}</span>
      {src && !failed && (
        // A plain <img>: the avatar must work in any React app, not only Next's
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          ref={(img) => {
            // An image that failed before hydration fires no error event React can see
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLSpanElement> {
  /** Avatar elements */
  children: ReactNode;
  /** Show at most this many, then a "+3" box for the rest */
  max?: number;
  /** Size for every avatar in the group, in px */
  size?: number;
  /** Shape for every avatar in the group and the "+3" box, unless an avatar sets its own */
  shape?: AvatarShape;
  /** Accessible name of the group: "Shared with". Each avatar already says its own name. */
  label?: string;
  /**
   * What the "+3" box does. "title" (the default) names the rest on hover, which is enough for a
   * few. "list" makes it a button, "Show all 43 people", that opens a popover listing everyone in
   * the group with each avatar's `detail` under the name: it scrolls past about ten, and past eight
   * it has a box to find someone by name. Use it where the rest can run to dozens, or on touch screens.
   * The list is a block, so then don't put the group inside a <p>.
   */
  overflow?: "title" | "list";
  /** Heading of the list. Default: the group's label, or "People". */
  listTitle?: string;
  /** Start with the list open (for stories and screenshots) */
  defaultListOpen?: boolean;
  /**
   * Makes each person a button, in the group and in the list, called with their avatar's index:
   * to filter by them, or open their profile. `personLabel` says what it does.
   */
  onPersonSelect?: (index: number) => void;
  /** The accessible name and hover text of a person's button, from their name: (name) => `Show ${name}'s cards`. Default: the name. */
  personLabel?: (name: string) => string;
}

/** Lower case, accents off, for finding "José" by typing "jose" */
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface Listed {
  index: number;
  name: string;
  src?: string;
  detail?: ReactNode;
  shape: AvatarShape;
}

/** Everyone in a group, in the popover: avatar, name and detail, a search box past eight, scrolling past about ten */
function PeopleList({ people, onSelect, personLabel }: { people: Listed[]; onSelect?: (index: number) => void; personLabel: (name: string) => string }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const shown = q ? people.filter((p) => fold(p.name).includes(q)) : people;
  const row = (p: Listed) => (
    <>
      <Avatar name={p.name} src={p.src} shape={p.shape} size={28} aria-hidden />
      <span className="flex min-w-0 flex-col leading-snug">
        <span className="truncate">{p.name}</span>
        {p.detail != null && <span className="truncate text-[12px] text-muted-foreground">{p.detail}</span>}
      </span>
    </>
  );
  return (
    <div className="flex flex-col">
      {people.length > 8 && (
        <div className="ctl-sm border-b border-border p-2">
          <Input data-autofocus type="search" prefix={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find someone" aria-label="Find someone by name" aria-controls={`${id}-list`} className="w-full" />
        </div>
      )}
      <ul id={`${id}-list`} aria-label={`${shown.length} of ${people.length}`} className="max-h-80 overflow-y-auto overscroll-contain py-1">
        {shown.map((p) => (
          <li key={p.index}>
            {onSelect ? (
              <button
                type="button"
                title={personLabel(p.name)}
                aria-label={personLabel(p.name)}
                onClick={() => onSelect(p.index)}
                className={cn("flex w-full cursor-pointer items-center gap-2 px-3 py-1 text-left hover:bg-secondary", FOCUS_RING, "focus-visible:-outline-offset-2")}
              >
                {row(p)}
              </button>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1">{row(p)}</span>
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-2 text-muted-foreground">Nobody by that name.</li>}
      </ul>
      <p aria-live="polite" className="sr-only">
        {q ? `${shown.length === 1 ? "1 person" : `${shown.length} people`} found` : ""}
      </p>
    </div>
  );
}

/**
 * Avatars side by side, each ringed in the background colour, so each one's ring cuts into the
 * one before it (no further overlap: it would hide the second initial). A "+3" box stands for the
 * rest past `max` and names them on hover, or, with `overflow="list"`, opens a list of everyone.
 * With `onPersonSelect` every person is a button.
 */
export function AvatarGroup({
  children,
  max = 4,
  size = 28,
  shape = "square",
  label,
  overflow = "title",
  listTitle,
  defaultListOpen = false,
  onPersonSelect,
  personLabel = (name) => name,
  className,
  ...rest
}: AvatarGroupProps) {
  const all = Children.toArray(children).filter((c): c is ReactElement<AvatarProps> => isValidElement(c));
  const names = all.map((c) => c.props.name);
  const shown = all.slice(0, max);
  const more = names.slice(max);
  const boxShape = shape === "circle" && "rounded-full";
  const box = (
    <span
      title={overflow === "title" ? more.join(", ") : undefined}
      aria-label={overflow === "title" ? `and ${more.length} more` : undefined}
      role={overflow === "title" ? "img" : undefined}
      className={cn("relative inline-flex shrink-0 items-center justify-center border border-border bg-muted leading-none text-foreground tabular-nums", boxShape)}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.4)) }}
    >
      <span aria-hidden>+{more.length}</span>
    </span>
  );
  // A person's button holds the avatar; the ring goes on the avatar inside, and focus shows outside the ring
  const button = cn("inline-flex shrink-0 cursor-pointer", FOCUS_RING, "focus-visible:outline-offset-2");
  return (
    <span
      data-slot="avatar-group"
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center align-middle [&>:not(button)]:outline-2 [&>:not(button)]:outline-background [&>button>*]:outline-2 [&>button>*]:outline-background",
        className,
      )}
      {...rest}
    >
      {shown.map((c, i) => {
        const avatar = cloneElement(c, { size: c.props.size ?? size, shape: c.props.shape ?? shape });
        if (!onPersonSelect) return avatar;
        return (
          <button key={c.key ?? i} type="button" title={personLabel(c.props.name)} aria-label={personLabel(c.props.name)} onClick={() => onPersonSelect(i)} className={button}>
            {avatar}
          </button>
        );
      })}
      {more.length > 0 &&
        (overflow === "list" ? (
          <Popover
            title={listTitle ?? label ?? "People"}
            align="end"
            defaultOpen={defaultListOpen}
            className="w-80"
            bodyClassName="p-0"
            trigger={(props) => (
              <button {...props} title={`Show all ${names.length} people`} aria-label={`Show all ${names.length} people`} className={button}>
                {box}
              </button>
            )}
          >
            {(close) => (
              <PeopleList
                people={all.map((c, index) => ({ index, name: c.props.name, src: c.props.src, detail: c.props.detail, shape: c.props.shape ?? shape }))}
                personLabel={personLabel}
                onSelect={
                  onPersonSelect &&
                  ((index) => {
                    close();
                    onPersonSelect(index);
                  })
                }
              />
            )}
          </Popover>
        ) : (
          box
        ))}
    </span>
  );
}
