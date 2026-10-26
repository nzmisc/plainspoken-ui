import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { searchBible } from "@/registry/plainspoken/blocks/bible/search";
import { BibleSearchResults } from "@/registry/plainspoken/blocks/bible/search-results";
import { BASE, JOHN, RUTH } from "./fixtures";

const SOURCES = [RUTH, JOHN];
const run = (q: string, opts?: Parameters<typeof searchBible>[2]) => searchBible(SOURCES, q, opts);

const meta: Meta<typeof BibleSearchResults> = {
  title: "Blocks/Bible/Bible search results",
  component: BibleSearchResults,
  args: { basePath: BASE, searchPath: `${BASE}/search`, result: run("love") },
};
export default meta;
type Story = StoryObj<typeof BibleSearchResults>;

/** “love” in Ruth and John: the word and its endings (loved, loveth). */
export const Words: Story = {};

/** A phrase in quotes matches exactly. */
export const Phrase: Story = { args: { result: run('"born again"') } };

/** A reference is offered as a link first, as well as searched as words. */
export const Reference: Story = { args: { result: run("John 3:16") } };

/** Filtered to one testament: the other's count stays visible. */
export const OneTestament: Story = { args: { result: run("lord", { testament: "OT" }) } };

/** Many results: pages of 50. */
export const Paged: Story = { args: { result: run("and", { page: 2 }) } };

/** Nothing found. */
export const NoResults: Story = { args: { result: run("dinosaur") } };

/** Before anything is typed: the intro slot. */
export const Empty: Story = { args: { result: run(""), intro: <p>Type a word, a “phrase” or a reference.</p> } };
