import { Canvas, CanvasControls } from "@/registry/plainspoken/ui/canvas";

const ROOMS = [
  { name: "Lisbon", note: "Meeting room · 8 seats", x: 0, y: 0, w: 220, h: 150 },
  { name: "Oslo", note: "Meeting room · 4 seats", x: 220, y: 0, w: 150, h: 150 },
  { name: "Kitchen", note: "Coffee, fridge, dishwasher", x: 370, y: 0, w: 250, h: 150 },
  { name: "Booths", note: "3 phone booths", x: 620, y: 0, w: 120, h: 150 },
  { name: "Open plan east", note: "24 desks", x: 0, y: 210, w: 370, h: 250, desks: 24 },
  { name: "Lifts", note: "", x: 370, y: 210, w: 80, h: 250 },
  { name: "Open plan west", note: "18 desks", x: 450, y: 210, w: 290, h: 250, desks: 18 },
];

/**
 * The third floor of an office, as a plan: drag to pan, scroll, pinch or Ctrl + scroll to zoom,
 * and the buttons at the bottom to zoom, fit and go back to 100%. Focus it and try the arrow keys,
 * + and −. The content is plain positioned boxes; `bounds` tells Fit where they are.
 */
export default function CanvasDemo() {
  return (
    <Canvas
      label="Third floor plan"
      className="h-80 border border-border"
      defaultTransform="fit"
      bounds={{ x: 0, y: 0, width: 740, height: 460 }}
      overlay={<CanvasControls className="absolute right-2 bottom-2" />}
    >
      {ROOMS.map((r) => (
        <div key={r.name} className="absolute border-2 border-foreground bg-background p-2" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
          <div className="font-bold">{r.name}</div>
          {r.note && <div className="text-[13px] text-muted-foreground">{r.note}</div>}
          {r.desks && (
            <div className="mt-3 grid grid-cols-[repeat(auto-fill,28px)] gap-2">
              {Array.from({ length: r.desks }, (_, i) => (
                <span key={i} className="size-7 border border-border bg-muted" />
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="absolute w-max text-[13px] tracking-widest text-muted-foreground uppercase" style={{ left: 300, top: 174 }}>
        Corridor
      </div>
    </Canvas>
  );
}
