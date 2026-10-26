import type { ReactElement } from "react";
import type { PictureKind } from "@/registry/plainspoken/blocks/kanban/data";
import { cn } from "@/lib/utils";

export interface KanbanPictureProps {
  kind: PictureKind;
  /** Something the picture is of, for a screen reader. Leave out where the file name next to it says enough. */
  label?: string;
  className?: string;
}

const C1 = "var(--chart-1)";
const C2 = "var(--chart-2)";
const C3 = "var(--chart-3)";
const C4 = "var(--chart-4)";
const LINE = "var(--muted-foreground)";
const PAPER = "var(--background)";
const EDGE = "var(--border)";

/** Rows of seats in two blocks either side of an aisle, inside a hull; a few taken, three picked */
function SeatMap() {
  const seats = [];
  for (let r = 0; r < 6; r++)
    for (let s = 0; s < 14; s++) {
      const x = 46 + s * 11 + (s >= 7 ? 12 : 0);
      const y = 30 + r * 11;
      const taken = (r * 5 + s * 3) % 7 === 0;
      const picked = r === 2 && s >= 8 && s <= 10;
      seats.push(<rect key={`${r}-${s}`} x={x} y={y} width="8" height="8" fill={picked ? C1 : taken ? LINE : C2} opacity={picked ? 1 : taken ? 0.35 : 0.55} />);
    }
  return (
    <>
      <rect width="240" height="120" fill={C2} opacity="0.12" />
      <path d="M30 18 H200 L228 60 L200 102 H30 Z" fill={PAPER} stroke={LINE} strokeWidth="1.5" opacity="0.9" />
      {seats}
      <path d="M46 99 H118 M132 99 H200" stroke={EDGE} strokeWidth="2" />
    </>
  );
}

/** Three phone screens side by side: a bar, lines of text, a button */
function Screens() {
  return (
    <>
      <rect width="240" height="120" fill={C1} opacity="0.12" />
      {[34, 98, 162].map((x, i) => (
        <g key={x}>
          <rect x={x} y="12" width="44" height="96" fill={PAPER} stroke={LINE} strokeWidth="1.5" />
          <rect x={x + 4} y="18" width="36" height="10" fill={i === 1 ? C1 : C2} opacity="0.8" />
          <path d={`M${x + 4} 38 H${x + 36} M${x + 4} 46 H${x + 30} M${x + 4} 54 H${x + 38} M${x + 4} 62 H${x + 24}`} stroke={LINE} strokeWidth="2" opacity="0.4" />
          <rect x={x + 4} y="72" width="36" height="22" fill={i === 2 ? C3 : C4} opacity="0.35" />
          <rect x={x + 4} y="98" width="36" height="6" fill={C1} />
        </g>
      ))}
    </>
  );
}

/** A form: labels and fields, one field focused, one with an error under it */
function Form() {
  return (
    <>
      <rect width="240" height="120" fill={C4} opacity="0.1" />
      <rect x="40" y="8" width="160" height="104" fill={PAPER} stroke={EDGE} />
      {[0, 1, 2].map((i) => {
        const y = 16 + i * 30;
        return (
          <g key={i}>
            <path d={`M52 ${y + 3} H${92 + i * 12}`} stroke={LINE} strokeWidth="2" opacity="0.5" />
            <rect x="52" y={y + 8} width="136" height="12" fill={PAPER} stroke={i === 1 ? "var(--destructive)" : LINE} strokeWidth={i === 1 ? 1.5 : 1} opacity={i === 1 ? 1 : 0.6} />
            {i === 0 && <rect x="49" y={y + 5} width="142" height="18" fill="none" stroke="var(--ring)" strokeWidth="2" />}
            {i === 1 && <path d={`M52 ${y + 25} H120`} stroke="var(--destructive)" strokeWidth="2" />}
          </g>
        );
      })}
      <rect x="52" y="98" width="44" height="10" fill={C1} />
    </>
  );
}

/** Sea, three islands, ports and a dashed route between them */
function SeaMap() {
  return (
    <>
      <rect width="240" height="120" fill={C2} opacity="0.25" />
      <path d="M8 74 L30 58 L58 62 L72 80 L60 104 L22 108 Z" fill={C3} opacity="0.75" />
      <path d="M150 10 L188 16 L206 40 L190 58 L160 52 L144 30 Z" fill={C3} opacity="0.75" />
      <path d="M104 86 L124 80 L136 94 L120 106 L102 100 Z" fill={C3} opacity="0.6" />
      <path d="M64 70 C100 60 130 50 156 44 M64 70 C88 84 100 92 112 92" fill="none" stroke={C1} strokeWidth="2" strokeDasharray="5 4" />
      {[
        [64, 70],
        [156, 44],
        [112, 92],
      ].map(([x, y]) => (
        <rect key={x} x={x - 4} y={y - 4} width="8" height="8" fill={PAPER} stroke={C1} strokeWidth="2" />
      ))}
    </>
  );
}

/** Three app icon options: a ferry on waves, on three grounds */
function Icons() {
  return (
    <>
      <rect width="240" height="120" fill={LINE} opacity="0.12" />
      {[
        [30, C2],
        [96, C1],
        [162, "var(--foreground)"],
      ].map(([x, bg], i) => {
        const X = Number(x);
        return (
          <g key={X}>
            <rect x={X} y="30" width="48" height="48" fill={bg as string} opacity={i === 1 ? 1 : 0.8} />
            <path d={`M${X + 10} 56 H${X + 38} L${X + 34} 64 H${X + 14} Z`} fill={PAPER} />
            <rect x={X + 18} y="46" width="12" height="10" fill={PAPER} />
            <path d={`M${X + 8} 70 q5 -4 10 0 t10 0 t10 0 t10 0`} fill="none" stroke={PAPER} strokeWidth="2" />
            {i === 1 && <rect x={X - 3} y="27" width="54" height="54" fill="none" stroke={C1} strokeWidth="2" />}
          </g>
        );
      })}
      <path d="M96 94 H144" stroke={LINE} strokeWidth="2" opacity="0.5" />
    </>
  );
}

/** Bars over a baseline */
function Chart() {
  const bars = [38, 52, 46, 70, 64, 82, 76];
  return (
    <>
      <rect width="240" height="120" fill={C3} opacity="0.1" />
      {bars.map((h, i) => (
        <rect key={i} x={40 + i * 24} y={100 - h} width="16" height={h} fill={i === bars.length - 2 ? C1 : C2} opacity="0.8" />
      ))}
      <path d="M32 100 H208" stroke={LINE} strokeWidth="1.5" />
    </>
  );
}

const DRAW: Record<PictureKind, () => ReactElement> = { "seat-map": SeatMap, screens: Screens, form: Form, map: SeaMap, icons: Icons, chart: Chart };

/**
 * A stand-in for one of the demo's image files (a seat map, phone screens, a form, a sea map, app
 * icons, a chart), drawn as SVG in the chart colours. The demo has no real pictures, this never
 * fails to load, and it follows light and dark mode. It fills its box, cropping to fit.
 */
export function KanbanPicture({ kind, label, className }: KanbanPictureProps) {
  return (
    <svg
      viewBox="0 0 240 120"
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-slot="kanban-picture"
      className={cn("block bg-background", className)}
    >
      {DRAW[kind]()}
    </svg>
  );
}
