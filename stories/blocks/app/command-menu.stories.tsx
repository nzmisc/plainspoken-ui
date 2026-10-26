import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppCommandMenu } from "@/registry/plainspoken/blocks/app/command-menu";

const meta: Meta<typeof AppCommandMenu> = {
  title: "Blocks/App skeleton/Command menu",
  component: AppCommandMenu,
  args: { open: true, onClose: () => {}, onNavigate: () => {}, onCreate: () => {} },
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  decorators: [(S) => <div className="min-h-[560px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppCommandMenu>;

/** Open, nothing typed: pages, create, customers and help. ↑/↓ move, Enter runs, Escape clears then closes. */
export const Open: Story = {};

/** Typed: matches in bold, best first. */
export const Typed: Story = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.ownerDocument.querySelector<HTMLInputElement>("dialog[open] input");
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "lis");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  },
};
