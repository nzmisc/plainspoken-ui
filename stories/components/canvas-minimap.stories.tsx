import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Canvas, CanvasControls } from "@/registry/plainspoken/ui/canvas";
import { CanvasMinimap } from "@/registry/plainspoken/ui/canvas-minimap";
import { CanvasNode, CanvasNodes } from "@/registry/plainspoken/ui/canvas-node";
import Retro from "@/registry/plainspoken/examples/canvas-minimap-demo";

/** Drag the frame to pan, or press anywhere on the map to jump there and drag on. Focused, arrow keys pan the canvas. */
const meta = {
  title: "Components/Layout/Canvas minimap",
  component: CanvasMinimap,
  args: { width: 192, height: 128, label: "Minimap" },
} satisfies Meta<typeof CanvasMinimap>;
export default meta;
type Story = StoryObj<typeof meta>;

const SPREAD = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`n${i}`, { x: (i % 6) * 260, y: Math.floor(i / 6) * 180 }]));

/** Size and name in the Controls panel; 24 nodes, colour by row. */
export const Playground: Story = {
  render: (args) => (
    <Canvas label="Grid of nodes" className="h-96 border border-border" defaultTransform={{ x: 20, y: 20, zoom: 0.8 }} overlay={<><CanvasControls className="absolute bottom-2 left-2" /><CanvasMinimap {...args} className="absolute right-2 bottom-2" nodeColor={(id) => `var(--chart-${(Math.floor(Number(id.slice(1)) / 6) % 4) + 1})`} /></>}>
      <CanvasNodes positions={SPREAD}>
        {Object.keys(SPREAD).map((id) => (
          <CanvasNode key={id} id={id} label={`Node ${id}`} className="flex h-28 w-48 items-center justify-center border border-border bg-background">
            {id}
          </CanvasNode>
        ))}
      </CanvasNodes>
    </Canvas>
  ),
};

/** The retrospective board from the docs, with notes in their group's colour. */
export const Retrospective: Story = { render: () => <Retro /> };

/** Without nodes the map shows just the frame. */
export const Empty: Story = {
  render: (args) => <Canvas label="Empty canvas" className="h-64 border border-border" overlay={<CanvasMinimap {...args} className="absolute right-2 bottom-2" />} />,
};
