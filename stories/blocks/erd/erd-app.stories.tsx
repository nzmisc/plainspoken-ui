import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErdApp } from "@/registry/plainspoken/blocks/erd/erd-app";

/**
 * Keyboard: Tab between tables; arrow keys move the selected ones (Shift for 10×), Space selects,
 * Enter opens the details, Delete removes, Ctrl+Z and Ctrl+Shift+Z undo and redo. With the canvas
 * itself focused, arrows pan, + and − zoom, 0 is 100%, 1 fits.
 */
const meta: Meta<typeof ErdApp> = {
  title: "Blocks/ERD/ERD app",
  component: ErdApp,
  parameters: { layout: "fullscreen" },
  args: { className: "h-[720px]" },
};
export default meta;
type Story = StoryObj<typeof ErdApp>;

/** The demo shop, nothing selected. */
export const Overview: Story = {};

/** orders selected: its relations stand out and its details are open. */
export const TableOpen: Story = { args: { defaultSelected: ["sales.orders"] } };

/** The 1 and N notation with curved lines, the legend open. */
export const Labels: Story = { args: { defaultDisplay: { notation: "labels", lines: "curved", legend: true } } };

/** Exporting SQL. */
export const ExportingSql: Story = { args: { defaultDialog: "export" }, parameters: { docs: { story: { inline: false, height: "640px" } } } };

/** Importing SQL. */
export const ImportingSql: Story = { args: { defaultDialog: "import" }, parameters: { docs: { story: { inline: false, height: "640px" } } } };

/** An empty diagram. */
export const Empty: Story = { args: { initial: { model: { name: "new_database", schemas: [], tables: [], relations: [] }, positions: {} } } };

/** A phone: the diagram alone; the list and details are drawers. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };

/** A phone with the table list open. */
export const PhoneTables: Story = {
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
  args: { className: "h-dvh", defaultPanel: "tables" },
  parameters: { docs: { story: { inline: false, height: "640px" } } },
};
