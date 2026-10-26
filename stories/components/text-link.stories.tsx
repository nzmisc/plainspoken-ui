import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { TextLink, linkVariants } from "@/registry/plainspoken/ui/text-link";

const meta = {
  title: "Components/Typography/Text link",
  component: TextLink,
  args: { href: "#docs", children: "the installation guide", external: false, variant: "default" },
  argTypes: { variant: { control: "inline-radio", options: ["default", "muted"] } },
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Blue and underlined, purple once visited (the empty href is this page, so it counts as visited), thicker underline on hover. */
export const InText: Story = {
  render: () => (
    <p className="max-w-prose">
      Read <TextLink href="#guide">the guide</TextLink>, then <TextLink href="">a visited link</TextLink>, and the{" "}
      <TextLink href="https://ui.shadcn.com/docs/registry" external>
        shadcn registry docs
      </TextLink>{" "}
      (external: opens a new tab, and says so to screen readers).
    </p>
  ),
};

/** The external mark stays on the line with the last word. */
export const ExternalWrapping: Story = {
  decorators: [(S) => <div className="w-48 border border-dashed border-border p-1"><S /></div>],
  render: () => (
    <p>
      See the{" "}
      <TextLink href="https://developer.mozilla.org/" external>
        MDN reference for the details element
      </TextLink>
      .
    </p>
  ),
};

export const Muted: Story = {
  render: () => (
    <p className="text-[13px] text-muted-foreground">
      © 2026 Example GmbH · <TextLink variant="muted" href="#privacy">Privacy</TextLink> ·{" "}
      <TextLink variant="muted" href="#terms">
        Terms
      </TextLink>
    </p>
  ),
};

/** linkVariants() on next/link's Link. */
export const RouterLink: Story = {
  render: () => (
    <p>
      Compare the plans on the{" "}
      <Link href="#pricing" className={linkVariants()}>
        pricing page
      </Link>
      .
    </p>
  ),
};
