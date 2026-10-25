"use client";

import { useState } from "react";
import { Magnet } from "@/registry/plainspoken/lib/icons";
import { Canvas, CanvasControls, type CanvasPoint } from "@/registry/plainspoken/ui/canvas";
import { CanvasNode, CanvasNodes } from "@/registry/plainspoken/ui/canvas-node";
import { Toggle } from "@/registry/plainspoken/ui/toggle";

const SERVICES = [
  { id: "gateway", name: "api-gateway", team: "Platform", x: 0, y: 120 },
  { id: "auth", name: "auth-service", team: "Identity", x: 260, y: 0 },
  { id: "orders", name: "orders-service", team: "Checkout", x: 260, y: 120 },
  { id: "search", name: "search-service", team: "Discovery", x: 260, y: 240 },
  { id: "postgres", name: "postgres-main", team: "Platform", x: 520, y: 60 },
  { id: "queue", name: "event-queue", team: "Platform", x: 520, y: 200 },
];

/**
 * Services on a map: drag one to move it, Shift + click to pick several and drag them together,
 * or Shift + drag on the background to draw a box round them. With a node focused, the arrow keys
 * move it (Shift for 10×) and Space selects it. Snap lines them up on the 20px grid.
 */
export default function CanvasNodeDemo() {
  const [positions, setPositions] = useState<Record<string, CanvasPoint>>(() => Object.fromEntries(SERVICES.map((s) => [s.id, { x: s.x, y: s.y }])));
  const [selected, setSelected] = useState<string[]>([]);
  const [snap, setSnap] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 ctl-sm">
        <Toggle icon={Magnet} pressed={snap} onPressedChange={setSnap}>
          Snap to grid
        </Toggle>
        <span className="text-[13px] text-muted-foreground">{selected.length ? `${selected.length} selected` : "Nothing selected"}</span>
      </div>
      <Canvas label="Service map" className="h-80 border border-border" defaultTransform="fit" overlay={<CanvasControls className="absolute right-2 bottom-2" />}>
        <CanvasNodes positions={positions} onPositionsChange={setPositions} selected={selected} onSelectedChange={setSelected} snap={snap ? 20 : 0} roleDescription="service">
          {SERVICES.map((s) => (
            <CanvasNode key={s.id} id={s.id} label={`${s.name}, ${s.team}`} name={s.name} className="w-[200px] border border-border bg-background">
              <div className="border-b border-border bg-muted px-2 py-1 font-mono text-[13px] font-bold">{s.name}</div>
              <div className="px-2 py-1 text-[13px] text-muted-foreground">Team {s.team}</div>
            </CanvasNode>
          ))}
        </CanvasNodes>
      </Canvas>
    </div>
  );
}
