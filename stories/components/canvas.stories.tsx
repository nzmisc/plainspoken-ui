import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Canvas, CanvasControls, type CanvasPoint } from "@/registry/plainspoken/ui/canvas";
import { CanvasNode, CanvasNodes } from "@/registry/plainspoken/ui/canvas-node";
import FloorPlan from "@/registry/plainspoken/examples/canvas-demo";
import Controlled from "@/registry/plainspoken/examples/canvas-controlled";

/**
 * Pointer: drag the background to pan (Shift+drag, or any drag with the select tool, draws a
 * selection box); the wheel or a trackpad scrolls; Ctrl or ⌘ + wheel, or a pinch, zooms around the
 * pointer; Space + drag and the middle button pan from anywhere. Touch: one finger pans, two
 * pinch. Keyboard, with the canvas focused: arrow keys pan (Shift for more), + and − zoom, 0 is
 * 100%, 1 fits everything.
 */
const meta = {
  title: "Components/Layout/Canvas",
  component: Canvas,
  argTypes: {
    grid: { control: "inline-radio", options: ["dots", "lines", "none"] },
    tool: { control: "inline-radio", options: ["pan", "select"] },
    gridSize: { control: { type: "number", min: 4, max: 80, step: 4 } },
    minZoom: { control: { type: "number", min: 0.05, max: 1, step: 0.05 } },
    maxZoom: { control: { type: "number", min: 1, max: 8, step: 0.5 } },
  },
  args: { label: "Shapes", grid: "dots", gridSize: 20, tool: "pan", minZoom: 0.1, maxZoom: 4 },
} satisfies Meta<typeof Canvas>;
export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ x, y, children }: { x: number; y: number; children: string }) => (
  <div className="absolute flex h-24 w-40 items-center justify-center border border-foreground bg-background font-bold" style={{ left: x, top: y }}>
    {children}
  </div>
);

function Shapes(args: Story["args"]) {
  return (
    <Canvas label="Shapes" {...args} className="h-96 border border-border" defaultTransform={{ x: 40, y: 40, zoom: 1 }} overlay={<CanvasControls className="absolute right-2 bottom-2" />}>
      <Box x={0} y={0}>Intake</Box>
      <Box x={240} y={0}>Review</Box>
      <Box x={480} y={0}>Approved</Box>
      <Box x={240} y={160}>Returned</Box>
    </Canvas>
  );
}

/** The grid, the drag tool and the zoom limits in the Controls panel. */
export const Playground: Story = { render: (args) => <Shapes {...args} /> };

/** Positioned boxes as a floor plan, fitted on load with `bounds`. */
export const FloorPlanExample: Story = { name: "Floor plan", render: () => <FloorPlan /> };

/** Controlled: the transform lives in state and shows under the canvas; the buttons glide to a stand through `canvasRef`. */
export const ControlledTransform: Story = { name: "Controlled", render: () => <Controlled /> };

/** A lined grid at 40px. */
export const LinedGrid: Story = { render: (args) => <Shapes {...args} grid="lines" gridSize={40} /> };

/** No grid: a plain background. */
export const NoGrid: Story = { render: (args) => <Shapes {...args} grid="none" /> };

function SelectTool() {
  const [positions, setPositions] = useState<Record<string, CanvasPoint>>({
    a: { x: 0, y: 0 },
    b: { x: 200, y: 40 },
    c: { x: 60, y: 180 },
    d: { x: 300, y: 200 },
  });
  const [selected, setSelected] = useState<string[]>(["b"]);
  return (
    <div className="flex flex-col gap-1">
      <Canvas label="Boxes" tool="select" className="h-80 border border-border" defaultTransform={{ x: 40, y: 40, zoom: 1 }} overlay={<CanvasControls className="absolute right-2 bottom-2" />}>
        <CanvasNodes positions={positions} onPositionsChange={setPositions} selected={selected} onSelectedChange={setSelected}>
          {Object.keys(positions).map((id) => (
            <CanvasNode key={id} id={id} label={`Box ${id.toUpperCase()}`} className="flex h-20 w-32 items-center justify-center border border-foreground bg-background font-bold">
              {id.toUpperCase()}
            </CanvasNode>
          ))}
        </CanvasNodes>
      </Canvas>
      <p className="text-[13px] text-muted-foreground">Selected: {selected.join(", ") || "none"}</p>
    </div>
  );
}

/** The select tool: dragging the background draws a box (Shift adds to the selection); Space + drag still pans. */
export const SelectToolStory: Story = { name: "Select tool", render: () => <SelectTool /> };

/** On a phone: one finger pans, two pinch. */
export const Phone: Story = { ...Playground, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
