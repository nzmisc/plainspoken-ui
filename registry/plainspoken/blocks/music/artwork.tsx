import type { ReactNode } from "react";
import { hash, initialsOf, seeded } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

// Artwork is content, not interface, so it has colours of its own: fixed palettes that read on a
// light page and a dark one alike. [background, shape, shape, ink]
const PALETTES: [string, string, string, string][] = [
  ["#1f3b4d", "#f2c14e", "#f78154", "#fdf6e3"],
  ["#0b6e4f", "#08a045", "#c7f2a7", "#f4f1de"],
  ["#3d348b", "#7678ed", "#f7b801", "#f35b04"],
  ["#2b2d42", "#8d99ae", "#ef233c", "#edf2f4"],
  ["#264653", "#2a9d8f", "#e9c46a", "#e76f51"],
  ["#5f0f40", "#fb8b24", "#e36414", "#f6e7d8"],
  ["#003049", "#d62828", "#fcbf49", "#eae2b7"],
  ["#22223b", "#4a4e69", "#c9ada7", "#f2e9e4"],
  ["#10002b", "#5a189a", "#c77dff", "#e0aaff"],
  ["#283618", "#606c38", "#dda15e", "#fefae0"],
  ["#03045e", "#0077b6", "#00b4d8", "#caf0f8"],
  ["#370617", "#9d0208", "#e85d04", "#ffba08"],
  ["#1b263b", "#415a77", "#ffd166", "#e0e1dd"],
  ["#432818", "#99582a", "#bb9457", "#ffe6a7"],
  ["#0d1b2a", "#ff006e", "#8338ec", "#ffbe0b"],
  ["#e9edc9", "#a3b18a", "#588157", "#344e41"],
  ["#f1faee", "#a8dadc", "#457b9d", "#1d3557"],
  ["#fff1e6", "#f4978e", "#f08080", "#6d2e46"],
];

type Pattern = "sun" | "stripes" | "dots" | "rings" | "blocks" | "waves" | "arcs" | "type";
const PATTERNS: Pattern[] = ["sun", "stripes", "dots", "rings", "blocks", "waves", "arcs", "type"];

function shapes(pattern: Pattern, [bg, a, b, ink]: string[], rand: () => number, text: string): ReactNode {
  const r = (lo: number, hi: number) => Math.round((lo + rand() * (hi - lo)) * 10) / 10;
  switch (pattern) {
    case "sun": {
      const y = r(52, 70);
      return (
        <>
          <circle cx={r(30, 70)} cy={y} r={r(22, 34)} fill={a} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="0" y={y + 4 + i * 7} width="100" height={2 + i * 0.8} fill={bg} />
          ))}
          <rect x="0" y={y + 34} width="100" height="40" fill={b} />
        </>
      );
    }
    case "stripes": {
      const w = r(7, 12);
      const angle = [45, -45, 30, -30, 60][Math.floor(rand() * 5)];
      return (
        <g transform={`rotate(${angle} 50 50)`}>
          {Array.from({ length: Math.ceil(200 / w) }, (_, i) => (
            <rect key={i} x={-50 + i * w * 2} y="-50" width={w} height="200" fill={i % 3 === 2 ? b : a} />
          ))}
        </g>
      );
    }
    case "dots": {
      const n = 4 + Math.floor(rand() * 2);
      const step = 100 / n;
      return Array.from({ length: n * n }, (_, i) => {
        const x = (i % n) * step + step / 2;
        const y = Math.floor(i / n) * step + step / 2;
        const s = rand();
        return s < 0.15 ? null : <circle key={i} cx={x} cy={y} r={step * (0.15 + s * 0.3)} fill={s > 0.7 ? b : a} />;
      });
    }
    case "rings": {
      const cx = r(20, 80);
      const cy = r(20, 80);
      return Array.from({ length: 9 }, (_, i) => <circle key={i} cx={cx} cy={cy} r={(9 - i) * 12} fill={i % 2 ? bg : i % 4 === 0 ? a : b} />);
    }
    case "blocks": {
      const x = r(30, 65);
      const y = r(30, 65);
      return (
        <>
          <rect x="0" y="0" width={x} height={y} fill={a} />
          <rect x={x + 4} y={y + 4} width={100 - x} height={100 - y} fill={b} />
          <rect x={x + 4} y="0" width={(100 - x) / 2} height={y / 2} fill={ink} />
          <rect x="0" y={y + 4} width={x / 3} height={100 - y} fill={ink} opacity="0.85" />
        </>
      );
    }
    case "waves": {
      const amp = r(5, 10);
      const freq = r(1.5, 3);
      return Array.from({ length: 7 }, (_, i) => {
        const base = 18 + i * 13;
        let d = `M0 ${base}`;
        for (let x = 0; x <= 100; x += 5) d += ` L${x} ${(base + Math.sin((x / 100) * Math.PI * 2 * freq + i * 0.7) * amp).toFixed(1)}`;
        d += " L100 120 L0 120 Z";
        return <path key={i} d={d} fill={i % 2 ? a : b} opacity={0.55 + i * 0.06} />;
      });
    }
    case "arcs": {
      return Array.from({ length: 16 }, (_, i) => {
        const x = (i % 4) * 25;
        const y = Math.floor(i / 4) * 25;
        const turn = Math.floor(rand() * 4) * 90;
        return (
          <g key={i} transform={`rotate(${turn} ${x + 12.5} ${y + 12.5})`}>
            <path d={`M${x} ${y} h25 a25 25 0 0 1 -25 25 z`} fill={i % 3 ? a : b} />
          </g>
        );
      });
    }
    case "type":
      return (
        <>
          <rect x="0" y={r(55, 70)} width="100" height="50" fill={a} />
          <text x="6" y="62" fill={ink} fontFamily="var(--font-geist), ui-sans-serif, system-ui, sans-serif" fontSize="52" fontWeight="800" letterSpacing="-3">
            {text}
          </text>
        </>
      );
  }
}

export interface ArtworkProps {
  /** What it is drawn from: the same seed always gives the same picture. Usually the item's id. */
  seed: string;
  /** Printed small along the bottom, like the words on a sleeve; also used for the "type" pattern's letters */
  title?: string;
  /**
   * The accessible name, "Glasshouse Summer cover". Leave out when the title is written next to
   * the picture, which is nearly always: the picture is then decorative.
   */
  label?: string;
  /** Width and height: px, or a CSS length ("100%") to fill the container */
  size?: number | string;
  /** Draw the seed's initials big, whatever the pattern (artists' pictures) */
  initials?: string;
  className?: string;
}

/**
 * Generated cover art, standing in for the square JPEG a real catalogue would have: one of eight
 * geometric patterns (sun, stripes, dots, rings, blocks, waves, arcs, big type) in one of
 * eighteen palettes, both picked from the seed, plus the title in small type. Flat SVG with no
 * ids, so it renders on the server and any number of copies can share a page.
 */
export function Artwork({ seed, title, label, size = 48, initials, className }: ArtworkProps) {
  const h = hash(seed);
  const palette = PALETTES[h % PALETTES.length];
  const pattern = PATTERNS[(h >>> 8) % PATTERNS.length];
  const rand = seeded(`${seed}:art`);
  const [bg, , , ink] = palette;
  const small = typeof size === "number" && size < 64;
  return (
    <svg
      data-slot="music-artwork"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
      className={cn("block aspect-square shrink-0 overflow-hidden bg-muted", className)}
    >
      <rect width="100" height="100" fill={bg} />
      {shapes(initials ? "type" : pattern, palette, rand, initials ?? initialsOf(title ?? seed))}
      {title && !small && pattern !== "type" && !initials && (
        <>
          <rect x="0" y="86" width="100" height="14" fill={bg} opacity="0.88" />
          <text x="5" y="95.5" fill={ink} fontFamily="var(--font-geist), ui-sans-serif, system-ui, sans-serif" fontSize="7" fontWeight="600">
            {title.length > 26 ? `${title.slice(0, 25)}…` : title}
          </text>
        </>
      )}
    </svg>
  );
}
