import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTACTS, type Person } from "@/registry/plainspoken/blocks/mail/data";
import { RecipientInput, type RecipientInputProps } from "@/registry/plainspoken/blocks/mail/recipient-input";
import { Measure } from "@/stories/support/measure";
import { Button } from "@/registry/plainspoken/ui/button";

function Controlled(props: Omit<RecipientInputProps, "value" | "onChange"> & { start?: Person[] }) {
  const [v, setV] = useState<Person[]>(props.start ?? []);
  return <RecipientInput {...props} value={v} onChange={setV} />;
}

const meta: Meta<typeof Controlled> = {
  title: "Blocks/Mail/Recipient input",
  component: Controlled,
  args: { label: "To", contacts: CONTACTS, placeholder: "Name or address", className: "max-w-md" },
};
export default meta;
type Story = StoryObj<typeof Controlled>;

/**
 * Type "ma" for suggestions: ↑/↓ move, Enter or Tab take one, Escape closes the list. Enter, a
 * comma or leaving the box turns typed text into a chip; Backspace in an empty box removes the
 * last chip; pasting "a@x.se, b@y.se" makes two.
 */
export const Playground: Story = {};

/** Some recipients, one of them not a valid address (red). */
export const WithChips: Story = { args: { start: [CONTACTS[2], CONTACTS[0], { name: "tomas@fernhill", email: "tomas@fernhill" }] } };

/** Invalid: a red border. */
export const Invalid: Story = { args: { invalid: true } };

/** The md box is a control's height and lines up with a button; it grows when the chips wrap. */
export const Alignment: Story = {
  render: (args) => (
    <Measure>
      <div className="flex items-start gap-2">
        <Controlled {...args} className="w-72" />
        <Button>Check</Button>
      </div>
    </Measure>
  ),
};
