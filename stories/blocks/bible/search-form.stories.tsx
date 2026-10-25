import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleSearchForm } from "@/registry/plainspoken/blocks/bible/search-form";
import { Measure } from "../../support/measure";

const meta: Meta<typeof BibleSearchForm> = {
  title: "Blocks/Bible/Bible search form",
  component: BibleSearchForm,
  args: { action: "/demos/bible/search" },
  argTypes: { size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] } },
};
export default meta;
type Story = StoryObj<typeof BibleSearchForm>;

export const Playground: Story = {};

/** After a search: the words stay in the box, and a testament filter is carried along. */
export const WithQuery: Story = { args: { defaultValue: "still small voice", testament: "OT" } };

/** Every size lines the box up with its button. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Measure key={s}>
          <BibleSearchForm {...args} size={s} />
        </Measure>
      ))}
    </div>
  ),
};
