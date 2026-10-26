import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { Select } from "@/registry/plainspoken/ui/select";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Forms/Select",
  component: Select,
  args: { options: ["Europe/Berlin", "Europe/London", "America/New_York"], "aria-label": "Time zone" },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Groups: Story = {
  args: {
    placeholder: "Choose a city…",
    options: [
      { group: "Europe", options: [{ value: "ber", label: "Berlin" }, { value: "lon", label: "London" }] },
      { group: "Americas", options: [{ value: "nyc", label: "New York" }, { value: "sf", label: "San Francisco", disabled: true }] },
    ],
  },
};

/** The label is centred like a button's; the box is as wide as the longest option. */
export const NextToButtons: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className={`ctl-${s} flex items-center gap-2`}>
            <Select options={["Short", "A much longer option"]} aria-label="Option" />
            <Button>Button</Button>
            <Select options={["Disabled"]} aria-label="Disabled" disabled />
          </div>
        ))}
      </div>
    </Measure>
  ),
};

export const InAField: Story = {
  render: () => (
    <div className="max-w-xs">
      <Field label="Plan" error="Pick a plan to continue." required>
        <Select placeholder="Choose…" options={["Free", "Team", "Enterprise"]} />
      </Field>
    </div>
  ),
};
