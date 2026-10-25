import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizablePanelHandle } from "@/registry/plainspoken/ui/resizable";

/**
 * Keyboard (the ARIA window splitter pattern): Tab to a line; ← and → (↑ and ↓ when stacked) move
 * it 5%, Home and End give the panel before it its smallest and largest size, Enter collapses or
 * restores a collapsible neighbour. Pointer: drag a line; double-click it to collapse or restore.
 */
const meta = {
  title: "Components/Layout/Resizable",
  component: ResizablePanelGroup,
  argTypes: { direction: { control: "inline-radio", options: ["horizontal", "vertical"] } },
  args: { direction: "horizontal" },
} satisfies Meta<typeof ResizablePanelGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const Pane = ({ children }: { children: string }) => <div className="flex h-full items-center justify-center p-3 text-muted-foreground">{children}</div>;

/** Two panels; switch the direction in the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <div className="h-64 border border-border">
      <ResizablePanelGroup {...args}>
        <ResizablePanel defaultSize={40}>
          <Pane>One (min 10%)</Pane>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60}>
          <Pane>Two</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/** Three panels with limits: the first stays between 15% and 30%, the last at least 30%. With a grip on the second line. */
export const ThreePanes: Story = {
  render: () => (
    <div className="h-72 border border-border">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted">
          <Pane>Folders 15–30%</Pane>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize folders" />
        <ResizablePanel defaultSize={35} minSize={20}>
          <Pane>Messages ≥ 20%</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize messages" />
        <ResizablePanel defaultSize={45} minSize={30}>
          <Pane>Reading ≥ 30%</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/** Stacked panels: the line moves with ↑ and ↓. */
export const Vertical: Story = {
  render: () => (
    <div className="h-80 border border-border">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={65} minSize={20}>
          <Pane>Editor</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize terminal" />
        <ResizablePanel defaultSize={35} minSize={15} className="bg-muted">
          <Pane>Terminal</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/** A group inside a panel, in the other direction. */
export const Nested: Story = {
  render: () => (
    <div className="h-96 border border-border">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={25} className="bg-muted">
          <Pane>Files</Pane>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75} className="overflow-hidden">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70}>
              <Pane>Editor</Pane>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} className="bg-muted">
              <Pane>Terminal</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

function CollapsibleDemo() {
  const left = useRef<ResizablePanelHandle>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [layout, setLayout] = useState<number[]>([]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => (collapsed ? left.current?.expand() : left.current?.collapse())}>
          {collapsed ? "Show sidebar" : "Hide sidebar"}
        </Button>
        <Button size="sm" onClick={() => left.current?.resize(30)}>
          Sidebar to 30%
        </Button>
        <code className="font-mono text-[12px] text-muted-foreground">onLayout: {JSON.stringify(layout)}</code>
      </div>
      <div className="h-64 border border-border">
        <ResizablePanelGroup onLayout={setLayout}>
          <ResizablePanel panelRef={left} defaultSize={25} minSize={15} collapsible onCollapsedChange={setCollapsed} className="bg-muted">
            <Pane>Sidebar: collapsible, min 15%</Pane>
          </ResizablePanel>
          <ResizableHandle aria-label="Resize sidebar" />
          <ResizablePanel defaultSize={50}>
            <Pane>Content</Pane>
          </ResizablePanel>
          <ResizableHandle aria-label="Resize details" />
          <ResizablePanel defaultSize={25} minSize={20} collapsible collapsedSize={6}>
            <Pane>Details: collapses to a 6% strip</Pane>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

/**
 * Collapsible panels: drag past half the minimum (it snaps shut, and snaps open again past half
 * way back), focus the line and press Enter, double-click the line, or use `panelRef`. A panel
 * collapsed to 0 is inert; the right one keeps a strip.
 */
export const Collapsible: Story = { render: () => <CollapsibleDemo /> };

/** The sizes are remembered under autoSaveId: resize, then reload the story. */
export const Remembered: Story = {
  render: () => (
    <div className="h-48 border border-border">
      <ResizablePanelGroup autoSaveId="storybook-resizable">
        <ResizablePanel defaultSize={30}>
          <Pane>Resize me, then reload</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <Pane>Remembered in localStorage</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
