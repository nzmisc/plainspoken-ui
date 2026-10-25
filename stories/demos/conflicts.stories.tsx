import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConflictsApp } from "@/registry/plainspoken/blocks/conflicts/conflicts-app";

const meta: Meta<typeof ConflictsApp> = {
  title: "Demos/Edit conflicts",
  component: ConflictsApp,
  // Scenarios open dialogs: on the docs page, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
};
export default meta;
type Story = StoryObj<typeof ConflictsApp>;

/** The demo as it is at /demos/conflicts: four approaches for a text box, five for a rich text document. */
export const EditConflicts: Story = {};

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
