"use client";

import { useRef, useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Canvas, CanvasControls, type CanvasHandle, type CanvasTransform } from "@/registry/plainspoken/ui/canvas";

const STANDS = [
  { name: "A1 Coffee roasters", x: 0, y: 0 },
  { name: "A2 Bakery", x: 260, y: 0 },
  { name: "A3 Cheese", x: 520, y: 0 },
  { name: "B1 Flowers", x: 0, y: 220 },
  { name: "B2 Fishmonger", x: 260, y: 220 },
  { name: "B3 Olives and oil", x: 520, y: 220 },
];

/**
 * A controlled transform, shown under the canvas as it changes, a lined grid, and `canvasRef` to
 * glide to a stand. The moves are instant when the system asks for reduced motion.
 */
export default function CanvasControlled() {
  const [t, setT] = useState<CanvasTransform>({ x: 24, y: 24, zoom: 0.75 });
  const canvas = useRef<CanvasHandle>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1 ctl-sm">
        {STANDS.map((s) => (
          <Button key={s.name} onClick={() => canvas.current?.centerOn({ x: s.x, y: s.y, width: 200, height: 140 }, { zoom: 1.25, animate: true })}>
            {s.name.split(" ")[0]}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => canvas.current?.fit({ animate: true })}>
          All stands
        </Button>
      </div>
      <Canvas
        label="Market hall stands"
        className="h-72 border border-border"
        grid="lines"
        gridSize={20}
        transform={t}
        onTransformChange={setT}
        canvasRef={canvas}
        bounds={{ x: 0, y: 0, width: 720, height: 360 }}
        overlay={<CanvasControls className="absolute right-2 bottom-2" />}
      >
        {STANDS.map((s) => (
          <div key={s.name} className="absolute flex h-[140px] w-[200px] items-center justify-center border border-foreground bg-background font-bold" style={{ left: s.x, top: s.y }}>
            {s.name}
          </div>
        ))}
      </Canvas>
      <p className="text-[13px] text-muted-foreground tabular-nums">
        x {Math.round(t.x)} · y {Math.round(t.y)} · zoom {Math.round(t.zoom * 100)}%
      </p>
    </div>
  );
}
