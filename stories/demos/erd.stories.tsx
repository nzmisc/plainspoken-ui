import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErdApp } from "@/registry/plainspoken/blocks/erd/erd-app";

const meta: Meta<typeof ErdApp> = {
  title: "Demos/ERD",
  component: ErdApp,
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof ErdApp>;

/** The demo as it is at /demos/erd: Joinery with harbour_goods, an invented shop's database of 28 tables. */
export const Diagram: Story = {};

/** A table open: orders, with its relations brought out. */
export const TableOpen: Story = { args: { defaultSelected: ["sales.orders"] } };

/** Importing CREATE TABLE statements. */
export const Importing: Story = { args: { defaultDialog: "import" } };

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };

/** On a phone, with the selected table's details in a drawer. */
export const PhoneDetails: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { defaultSelected: ["sales.orders"], defaultPanel: "details" } };
