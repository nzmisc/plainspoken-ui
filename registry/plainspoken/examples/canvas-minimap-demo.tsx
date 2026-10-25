"use client";

import { useState } from "react";
import { Canvas, CanvasControls, type CanvasPoint } from "@/registry/plainspoken/ui/canvas";
import { CanvasMinimap } from "@/registry/plainspoken/ui/canvas-minimap";
import { CanvasNode, CanvasNodes } from "@/registry/plainspoken/ui/canvas-node";

const GROUPS = [
  { title: "Went well", color: "var(--chart-3)", notes: ["Release went out on Tuesday as planned", "Pairing on the importer", "Fewer pages at night", "New staging data is realistic", "Design review before the build", "Docs for the billing API"] },
  { title: "To improve", color: "var(--chart-2)", notes: ["Flaky checkout tests", "Too many meetings on Thursday", "Hand-over to support was late", "Nobody owns the search index", "PRs waiting two days for review"] },
  { title: "Ideas", color: "var(--chart-1)", notes: ["A shared on-call calendar", "Record the demos", "Try trunk-based work for a sprint", "One no-meeting afternoon", "Feature flags for the new cart"] },
  { title: "Actions", color: "var(--chart-4)", notes: ["Quarantine the flaky tests (Ines)", "Name an owner for search (Dev lead)", "Move the Thursday sync (Tom)", "Review rota in the team channel (all)"] },
];

const NOTES = GROUPS.flatMap((g, gi) =>
  g.notes.map((text, i) => ({ id: `${gi}-${i}`, group: gi, text, x: gi * 440 + (i % 2) * 200, y: 60 + Math.floor(i / 2) * 140 })),
);

/**
 * A retrospective board too big for its frame. The map in the corner shows every note in its
 * group's colour and the part in view; drag the frame, or press anywhere on the map to jump.
 */
export default function CanvasMinimapDemo() {
  const [positions, setPositions] = useState<Record<string, CanvasPoint>>(() => Object.fromEntries(NOTES.map((n) => [n.id, { x: n.x, y: n.y }])));
  return (
    <Canvas
      label="Sprint 41 retrospective"
      className="h-96 border border-border"
      defaultTransform={{ x: 20, y: 10, zoom: 1 }}
      overlay={
        <>
          <CanvasControls className="absolute bottom-2 left-2" />
          <CanvasMinimap className="absolute right-2 bottom-2" width={160} height={96} nodeColor={(id) => GROUPS[Number(id.split("-")[0])]?.color} />
        </>
      }
    >
      {GROUPS.map((g, gi) => (
        <h3 key={g.title} className="absolute w-max text-[16px] font-bold" style={{ left: gi * 440, top: 16 }}>
          {g.title}
        </h3>
      ))}
      <CanvasNodes positions={positions} onPositionsChange={setPositions} roleDescription="note">
        {NOTES.map((n) => (
          <CanvasNode key={n.id} id={n.id} label={n.text} className="w-[180px] border border-border bg-background p-2 text-[13px]" style={{ borderTop: `4px solid ${GROUPS[n.group].color}` }}>
            {n.text}
          </CanvasNode>
        ))}
      </CanvasNodes>
    </Canvas>
  );
}
