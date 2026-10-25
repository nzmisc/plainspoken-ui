import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleJump } from "@/registry/plainspoken/blocks/bible/jump";
import { BASE, BOOKS } from "./fixtures";

const meta: Meta<typeof BibleJump> = {
  title: "Blocks/Bible/Bible jump",
  component: BibleJump,
  args: { books: BOOKS, book: "psalms", chapter: 23, basePath: BASE },
  argTypes: { size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] } },
};
export default meta;
type Story = StoryObj<typeof BibleJump>;

/** All 66 books, grouped by testament. Pick Jude and the chapter resets to 1. */
export const Playground: Story = {};

/** Small, for a toolbar. */
export const Small: Story = { args: { size: "sm" } };
