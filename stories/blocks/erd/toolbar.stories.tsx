import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DEFAULT_DISPLAY } from "@/registry/plainspoken/blocks/erd/model";
import { ErdToolbar } from "@/registry/plainspoken/blocks/erd/toolbar";
import Demo from "@/registry/plainspoken/examples/erd-toolbar-demo";

/** Undo and Redo name what they'd do; Layout, View and Export are menus (↓ opens, arrows move). */
const meta: Meta<typeof ErdToolbar> = {
  title: "Blocks/ERD/Toolbar",
  component: ErdToolbar,
  args: {
    display: DEFAULT_DISPLAY,
    onDisplayChange: () => {},
    undo: "Moved orders",
    redo: null,
    onUndo: () => {},
    onRedo: () => {},
    onAddTable: () => {},
    onAutoLayout: () => {},
    onResetLayout: () => {},
    onCollapseAll: () => {},
    onImport: () => {},
    onExport: () => {},
    className: "border border-border",
  },
  argTypes: { display: { control: false } },
};
export default meta;
type Story = StoryObj<typeof ErdToolbar>;

/** Wired to state, reporting what was asked. */
export const Working: Story = { render: () => <Demo /> };

/** Nothing to undo or redo, the select tool on, snapping off. */
export const Fresh: Story = { args: { undo: null, display: { ...DEFAULT_DISPLAY, tool: "select", snap: false } } };

/** On a phone: icons only, and the row scrolls sideways. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
