import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryResultList } from "@/registry/plainspoken/blocks/library/result-list";
import { BASE, BRANCHES, TODAY, result } from "./fixtures";

const meta: Meta<typeof LibraryResultList> = {
  title: "Blocks/Library/Library result list",
  component: LibraryResultList,
  args: {
    basePath: BASE,
    branches: BRANCHES,
    today: TODAY,
    defaultBranch: "riverside",
    results: ["beloved", "james", "the-hobbit", "parasite", "le-petit-prince"].map(result),
  },
};
export default meta;
type Story = StoryObj<typeof LibraryResultList>;

/** Formats in every state: available, all out, a queue, and a DVD. */
export const Mixed: Story = {};

/** Page two counts on from 21. */
export const SecondPage: Story = { args: { start: 21, results: ["dune", "foundation"].map(result) } };

/** On a phone the description hides and the button goes under the formats. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
