import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConflictsApp } from "@/registry/plainspoken/blocks/conflicts/conflicts-app";

const meta: Meta<typeof ConflictsApp> = {
  title: "Blocks/Edit conflicts/Edit conflicts app",
  component: ConflictsApp,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof ConflictsApp>;

/** All the prototypes: the text box approaches, then the rich text ones, each with a comparison table. */
export const Page: Story = {};

/** On a phone: the tabs scroll sideways, the screens stack, the tables scroll. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
