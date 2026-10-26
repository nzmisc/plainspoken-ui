import { cn } from "@/lib/utils";

// Pictures are content, so they have fixed colours of their own: [sky top, sky low, far, near, sun]
const SCENES: [string, string, string, string, string][] = [
  ["#1d3557", "#e76f51", "#264653", "#1b2a33", "#f4a261"],
  ["#a8dadc", "#f1faee", "#457b9d", "#1d3557", "#fefae0"],
  ["#2b2d42", "#8d99ae", "#4a4e69", "#22223b", "#edf2f4"],
  ["#ffcdb2", "#ffb4a2", "#b5838d", "#6d6875", "#fff1e6"],
  ["#0b132b", "#3a506b", "#1c2541", "#0b132b", "#f6f7d7"],
  ["#caf0f8", "#90e0ef", "#0077b6", "#03045e", "#ffffff"],
  ["#f6bd60", "#f7ede2", "#84a59d", "#3d5a4c", "#f28482"],
  ["#432818", "#bb9457", "#99582a", "#3b2314", "#ffe6a7"],
  ["#e9edc9", "#fefae0", "#a3b18a", "#3a5a40", "#d4a373"],
  ["#5f0f40", "#fb8b24", "#9a031e", "#3a0a24", "#ffd6a5"],
];

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A ridge line across the width, `rough` how jagged, as a closed path down to the bottom */
function ridge(rand: () => number, w: number, h: number, base: number, rough: number): string {
  let d = `M0 ${h} L0 ${base}`;
  const steps = 8 + Math.floor(rand() * 6);
  for (let i = 1; i <= steps; i++) d += ` L${((w * i) / steps).toFixed(1)} ${(base - rand() * rough).toFixed(1)}`;
  return `${d} L${w} ${h} Z`;
}

function Scene({ seed, w, h }: { seed: string; w: number; h: number }) {
  const rand = rng(seed);
  const [top, low, far, near, sun] = SCENES[hash(seed) % SCENES.length];
  const kind = (hash(seed) >>> 5) % 3; // 0 hills, 1 city, 2 sea
  const horizon = h * (0.5 + rand() * 0.15);
  const bands = 6;
  return (
    <>
      {Array.from({ length: bands }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={(horizon / bands) * i}
          width={w}
          height={horizon / bands + 1}
          fill={i < bands / 2 ? top : low}
          opacity={i < bands / 2 ? 1 - i * 0.12 : 0.6 + i * 0.07}
        />
      ))}
      <rect x="0" y={horizon * 0.5} width={w} height={horizon * 0.5 + 1} fill={low} opacity="0.5" />
      <circle
        cx={(w * (0.2 + rand() * 0.6)).toFixed(1)}
        cy={(horizon * (0.35 + rand() * 0.35)).toFixed(1)}
        r={(h * (0.08 + rand() * 0.08)).toFixed(1)}
        fill={sun}
      />
      {kind === 0 && (
        <>
          <path d={ridge(rand, w, h, horizon, h * 0.18)} fill={far} />
          <path d={ridge(rand, w, h, horizon + h * 0.12, h * 0.1)} fill={near} />
        </>
      )}
      {kind === 1 && (
        <>
          <path d={ridge(rand, w, h, horizon + h * 0.05, h * 0.06)} fill={far} opacity="0.7" />
          {Array.from({ length: 14 }, (_, i) => {
            const bw = w / 14;
            const bh = h * (0.12 + rand() * 0.3);
            return (
              <rect
                key={i}
                x={(i * bw).toFixed(1)}
                y={(h - bh - h * 0.1).toFixed(1)}
                width={(bw * (0.7 + rand() * 0.3)).toFixed(1)}
                height={bh.toFixed(1)}
                fill={near}
              />
            );
          })}
          <rect x="0" y={h * 0.9} width={w} height={h * 0.1} fill={near} />
        </>
      )}
      {kind === 2 && (
        <>
          <rect x="0" y={horizon} width={w} height={h - horizon} fill={far} />
          {Array.from({ length: 7 }, (_, i) => (
            <rect
              key={i}
              x={(rand() * w * 0.8).toFixed(1)}
              y={(horizon + 6 + i * ((h - horizon) / 7)).toFixed(1)}
              width={(w * (0.1 + rand() * 0.25)).toFixed(1)}
              height="2"
              fill={sun}
              opacity="0.5"
            />
          ))}
          <path d={ridge(rand, w * 0.4, h, horizon + 1, h * 0.06)} fill={near} />
        </>
      )}
    </>
  );
}

export interface PostImageProps {
  /** The same seed always gives the same picture */
  seed: string;
  /** What the picture shows: its alt text, and the text of the ALT badge */
  alt: string;
  /** Width / height. Default 16 / 9. */
  ratio?: number;
  className?: string;
}

/**
 * A picture in a post, generated from a seed (a sky, a sun, then hills, a skyline or the sea) in
 * place of a photo. It carries its alt text, as every picture in a post should, with a small
 * "ALT" mark in the corner that shows the text on hover.
 */
export function PostImage({ seed, alt, ratio = 16 / 9, className }: PostImageProps) {
  const w = 320;
  const h = Math.round(w / ratio);
  return (
    <figure data-slot="social-post-image" className={cn("relative overflow-hidden border border-border bg-muted", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={alt} preserveAspectRatio="xMidYMid slice" className="block h-auto max-h-[28rem] w-full">
        <Scene seed={seed} w={w} h={h} />
      </svg>
      <span
        title={alt}
        aria-hidden
        className="absolute bottom-1.5 left-1.5 border border-border bg-background/85 px-1 text-[11px] leading-4 font-bold text-foreground"
      >
        ALT
      </span>
    </figure>
  );
}

/** A profile's banner: a wide generated picture, 3 to 1 */
export function ProfileBanner({ seed, className }: { seed: string; className?: string }) {
  return (
    <svg
      data-slot="social-banner"
      viewBox="0 0 600 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn("block aspect-[3/1] w-full bg-muted", className)}
    >
      <Scene seed={`banner-${seed}`} w={600} h={200} />
    </svg>
  );
}
