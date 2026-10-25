import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibrarySearchForm } from "@/registry/plainspoken/blocks/library/search-form";
import { Measure } from "../../support/measure";
import { BASE } from "./fixtures";

const meta: Meta<typeof LibrarySearchForm> = {
  title: "Blocks/Library/Library search form",
  component: LibrarySearchForm,
  args: { action: `${BASE}/search` },
  argTypes: { size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] }, defaultScope: { control: "inline-radio", options: ["keyword", "title", "author", "subject"] } },
};
export default meta;
type Story = StoryObj<typeof LibrarySearchForm>;

export const Playground: Story = {};

/** After a search by author. */
export const WithQuery: Story = { args: { defaultValue: "Morrison", defaultScope: "author" } };

/** Without the field select, for a header. */
export const Compact: Story = { args: { compact: true, size: "sm", className: "w-72" } };

/** The select, the box and the button are one height at every size. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Measure key={s}>
          <LibrarySearchForm {...args} size={s} />
        </Measure>
      ))}
    </div>
  ),
};
