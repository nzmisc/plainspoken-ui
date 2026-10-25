import { cn } from "@/lib/utils";

export interface BlogPortraitProps {
  /** Whose portrait: the accessible name says "Drawing of …" */
  name: string;
  /** Width and height in px. Default 120. */
  size?: number;
  className?: string;
}

/**
 * A drawn portrait in the theme's colours, for a site that would rather not put a photo up: a
 * line drawing of a person with glasses, on the muted background. It follows light and dark mode
 * by itself, and loads nothing. Swap it for an <img> of yourself when you have one.
 */
export function BlogPortrait({ name, size = 120, className }: BlogPortraitProps) {
  return (
    <svg
      data-slot="blog-portrait"
      role="img"
      aria-label={`Drawing of ${name}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={cn("shrink-0 border border-border bg-muted", className)}
    >
      {/* Hills behind, and the sun */}
      <circle cx="96" cy="26" r="9" fill="var(--color-chart-2)" opacity="0.55" />
      <path d="M0 92 L26 70 L44 84 L70 58 L96 80 L120 66 L120 120 L0 120 Z" fill="var(--color-border)" opacity="0.7" />
      {/* Hair, behind the face */}
      <path d="M37 58 C34 32 46 22 61 22 C77 22 87 33 84 58 L86 88 L34 88 Z" fill="var(--color-chart-2)" />
      {/* Shoulders and neck */}
      <path d="M18 120 C20 98 36 88 60 88 C84 88 100 98 102 120 Z" fill="var(--color-chart-1)" />
      <path d="M52 74 L52 90 C56 94 64 94 68 90 L68 74 Z" fill="var(--color-background)" stroke="var(--color-foreground)" strokeWidth="1.5" />
      {/* Face */}
      <ellipse cx="60" cy="56" rx="17" ry="20" fill="var(--color-background)" stroke="var(--color-foreground)" strokeWidth="1.5" />
      {/* Fringe */}
      <path d="M43 50 C46 36 56 32 64 33 C72 34 78 40 78 50 C70 44 60 41 50 46 Z" fill="var(--color-chart-2)" />
      {/* Glasses */}
      <g fill="none" stroke="var(--color-foreground)" strokeWidth="1.5">
        <rect x="46" y="53" width="11" height="8" />
        <rect x="63" y="53" width="11" height="8" />
        <path d="M57 56 L63 56" />
      </g>
      {/* Mouth */}
      <path d="M54 68 Q60 72 66 68" fill="none" stroke="var(--color-foreground)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
