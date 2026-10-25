"use client";

import { Children, cloneElement, isValidElement, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
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
}

/**
 * A square or round picture, or initials on a colour, standing for a person or a machine. The
 * colour comes from the name (the same name always gets the same one), from the chart colours.
 * The picture sits over the initials, so there is never an empty box: while it loads or if it
 * fails to load, the initials show.
 */
export function Avatar({ name, src, size = 28, shape = "square", className, style, ...rest }: AvatarProps) {
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
  /** Show at most this many, then a "+3" box naming the rest on hover */
  max?: number;
  /** Size for every avatar in the group, in px */
  size?: number;
  /** Shape for every avatar in the group and the "+3" box, unless an avatar sets its own */
  shape?: AvatarShape;
  /** Accessible name of the group: "Shared with". Each avatar already says its own name. */
  label?: string;
}

/**
 * Avatars side by side, each ringed in the background colour, so each one's ring cuts into the
 * one before it (no further overlap: it would hide the second initial). A "+3" box stands for the
 * rest past `max` and names them on hover.
 */
export function AvatarGroup({ children, max = 4, size = 28, shape = "square", label, className, ...rest }: AvatarGroupProps) {
  const all = Children.toArray(children).filter((c): c is ReactElement<AvatarProps> => isValidElement(c));
  const names = all.map((c) => c.props.name);
  const shown = all.slice(0, max);
  const more = names.slice(max);
  return (
    <span
      data-slot="avatar-group"
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center align-middle [&>*]:outline-2 [&>*]:outline-background", className)}
      {...rest}
    >
      {shown.map((c) => cloneElement(c, { size: c.props.size ?? size, shape: c.props.shape ?? shape }))}
      {more.length > 0 && (
        <span
          title={more.join(", ")}
          aria-label={`and ${more.length} more`}
          role="img"
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center border border-border bg-muted leading-none text-foreground tabular-nums",
            shape === "circle" && "rounded-full",
          )}
          style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.4)) }}
        >
          <span aria-hidden>+{more.length}</span>
        </span>
      )}
    </span>
  );
}
