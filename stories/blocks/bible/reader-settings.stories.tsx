import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleReaderSettings } from "@/registry/plainspoken/blocks/bible/reader-settings";
import Demo from "@/registry/plainspoken/examples/bible-reader-settings-demo";

const meta: Meta<typeof BibleReaderSettings> = {
  title: "Blocks/Bible/Bible reader settings",
  component: BibleReaderSettings,
  argTypes: { size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] } },
};
export default meta;
type Story = StoryObj<typeof BibleReaderSettings>;

/** With a few verses under it, to see the settings work. */
export const WithText: Story = { render: () => <Demo /> };

/** Open, to see the controls: segmented controls for the choices, a switch for the numbers. */
export const Open: Story = { args: { defaultOpen: true }, decorators: [(S) => <div className="flex min-h-80 justify-end">{S()}</div>] };
