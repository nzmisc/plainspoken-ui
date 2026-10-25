import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { Measure } from "../support/measure";

const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc3e6"/><circle cx="34" cy="14" r="6" fill="#f5d76e"/><path d="M0 34 L14 22 L26 32 L36 24 L48 32 V48 H0Z" fill="#5f8f5a"/></svg>`,
  );

const meta = {
  title: "Components/Data display/Avatar",
  component: Avatar,
  args: { name: "Amara Okafor", size: 28 },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Initials on a colour from the name: the same name always gets the same colour. */
export const Initials: Story = {
  render: () => (
    <p className="flex flex-wrap items-center gap-2">
      {["Amara Okafor", "Jonas Weber", "Li Wei", "María González", "Noah Fischer", "Sofia Rossi", "build-runner-03", "ops@example.com", "ana"].map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </p>
  ),
};

/** A picture sits over the initials; a picture that fails to load leaves them showing. */
export const Pictures: Story = {
  render: () => (
    <p className="flex items-center gap-2">
      <Avatar name="Noah Fischer" src={PHOTO} size={48} />
      <Avatar name="Sofia Rossi" src="/does-not-exist.png" size={48} />
    </p>
  ),
};

/** Size in px. 20, 24, 28 and 36 match the control heights, so an avatar lines up with buttons. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {([20, 24, 28, 36] as const).map((size, i) => (
          <div key={size} className="flex items-center gap-2">
            <span data-measure className="inline-flex">
              <Avatar name="Li Wei" size={size} />
            </span>
            <Button size={(["xs", "sm", "md", "lg"] as const)[i]}>Follow</Button>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <Avatar name="Li Wei" size={48} />
          <Avatar name="Li Wei" size={64} />
          <Avatar name="Li Wei" size={96} />
        </div>
      </div>
    </Measure>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <AvatarGroup label="Editing now" max={3}>
        <Avatar name="Amara Okafor" />
        <Avatar name="Jonas Weber" />
        <Avatar name="Li Wei" src={PHOTO} />
        <Avatar name="María González" />
        <Avatar name="Noah Fischer" />
        <Avatar name="Sofia Rossi" />
      </AvatarGroup>
      <AvatarGroup size={20}>
        <Avatar name="Amara Okafor" />
        <Avatar name="Jonas Weber" />
      </AvatarGroup>
    </div>
  ),
};
