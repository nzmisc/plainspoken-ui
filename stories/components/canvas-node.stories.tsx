import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Canvas, CanvasControls, type CanvasPoint } from "@/registry/plainspoken/ui/canvas";
import { CanvasNode, CanvasNodes } from "@/registry/plainspoken/ui/canvas-node";
import Services from "@/registry/plainspoken/examples/canvas-node-demo";

/**
 * Pointer: drag a node (with the rest of the selection); Shift, Ctrl or ⌘ + click adds or removes
 * one; Shift + drag on the background draws a box. Keyboard, on a focused node: arrow keys move
 * the selection (Shift for 10×), Space selects, Enter opens (`onOpen`), Escape clears, Ctrl or
 * ⌘ + A selects all, Delete removes (`onDelete`). Moves are announced politely.
 */
const meta = {
  title: "Components/Layout/Canvas node",
  component: CanvasNodes,
  parameters: { controls: { exclude: ["positions", "children", "selected", "defaultSelected"] } },
  args: { snap: 20, autoPan: true, roleDescription: "node", positions: {}, children: null },
} satisfies Meta<typeof CanvasNodes>;
export default meta;
type Story = StoryObj<typeof meta>;

const START: Record<string, CanvasPoint> = {
  draft: { x: 0, y: 0 },
  review: { x: 220, y: 0 },
  legal: { x: 220, y: 140 },
  publish: { x: 440, y: 60 },
};

function Board({ snap, autoPan, defaultSelected = [], locked = [] }: { snap?: number; autoPan?: boolean; defaultSelected?: string[]; locked?: string[] }) {
  const [positions, setPositions] = useState(START);
  const [log, setLog] = useState("Nothing opened yet");
  return (
    <div className="flex flex-col gap-1">
      <Canvas label="Publishing steps" className="h-80 border border-border" gridSize={snap || 20} defaultTransform={{ x: 40, y: 60, zoom: 1 }} overlay={<CanvasControls className="absolute right-2 bottom-2" />}>
        <CanvasNodes
          positions={positions}
          onPositionsChange={setPositions}
          defaultSelected={defaultSelected}
          snap={snap}
          autoPan={autoPan}
          onOpen={(id) => setLog(`Opened ${id}`)}
          onDelete={(ids) => setLog(`Asked to delete ${ids.join(", ")}`)}
          roleDescription="step"
        >
          {Object.keys(positions).map((id) => (
            <CanvasNode key={id} id={id} label={`${id} step`} name={id} locked={locked.includes(id)} className="w-44 border border-border bg-background">
              <div className="border-b border-border bg-muted px-2 py-1 font-bold capitalize">{id}</div>
              <div className="px-2 py-1 text-[13px] text-muted-foreground">{locked.includes(id) ? "Locked: select only" : "Drag me"}</div>
            </CanvasNode>
          ))}
        </CanvasNodes>
      </Canvas>
      <p className="text-[13px] text-muted-foreground" aria-live="polite">
        {log}
      </p>
    </div>
  );
}

/** Snap and auto-pan in the Controls panel; Enter or a double-click "opens" a node, Delete asks to delete it (see the line underneath). */
export const Playground: Story = { render: (args) => <Board snap={args.snap} autoPan={args.autoPan} /> };

/** The example from the docs: services with a snap toggle. */
export const ServiceMap: Story = { render: () => <Services /> };

/** Two selected: drawn with a frame and brought to the front. */
export const Selected: Story = { render: () => <Board snap={20} defaultSelected={["review", "legal"]} /> };

/** Free movement, no snapping. */
export const NoSnap: Story = { render: () => <Board snap={0} /> };

/** A locked node: it can be selected and focused, not moved. */
export const Locked: Story = { render: () => <Board snap={20} locked={["publish"]} /> };
