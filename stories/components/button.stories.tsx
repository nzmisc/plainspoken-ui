import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Bold, ChevronDown, Download, Ellipsis, Italic, Plus, RefreshCw, Trash, Underline } from "@/registry/plainspoken/lib/icons";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button, ButtonGroup, IconButton, buttonVariants, type ButtonVariant } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Controls/Button",
  component: Button,
  args: { children: "Restart service", variant: "default" },
  argTypes: {
    variant: { control: "select", options: ["default", "primary", "secondary", "outline", "destructive", "ghost", "link"] },
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    icon: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: ButtonVariant[] = ["default", "primary", "secondary", "outline", "destructive", "ghost", "link"];

/** Every prop in the Controls panel. */
export const Playground: Story = {};

/** Seven variants, each with a 1px border (transparent where none shows), so swapping one for another never moves anything. */
export const Variants: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.map((v) => (
            <Button key={v} variant={v} icon={RefreshCw}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.filter((v) => v !== "link").map((v) => (
            <IconButton key={v} variant={v} icon={RefreshCw} label={`Refresh (${v})`} />
          ))}
        </div>
      </div>
    </Measure>
  ),
};

/** Four heights; within a size, text, icon-and-text and icon-only buttons are the same height. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className="flex flex-wrap items-center gap-2">
            <span className="w-14 font-mono text-[12px] text-muted-foreground">
              {s} {CONTROL_HEIGHT[s]}px
            </span>
            <Button size={s}>Default</Button>
            <Button size={s} variant="primary" icon={Plus}>
              New
            </Button>
            <Button size={s} variant="destructive" icon={Trash}>
              Delete
            </Button>
            <Button size={s} iconEnd={ChevronDown}>
              Menu
            </Button>
            <IconButton size={s} icon={Ellipsis} label="More" />
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** Disabled and loading. Loading keeps the label (invisible) so the width doesn't jump. */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled>Disabled</Button>
      <Button variant="primary" disabled>
        Disabled primary
      </Button>
      <Button loading>Saving changes</Button>
      <Button variant="primary" loading>
        Publishing
      </Button>
    </div>
  ),
};

export const Groups: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonGroup label="Text style">
        <IconButton icon={Bold} label="Bold" />
        <IconButton icon={Italic} label="Italic" />
        <IconButton icon={Underline} label="Underline" />
      </ButtonGroup>
      <ButtonGroup label="Pages" size="sm">
        <Button>Previous</Button>
        <Button>Next</Button>
      </ButtonGroup>
    </div>
  ),
};

/** buttonVariants() on an <a>: a link that looks like a button, with no underline or visited purple showing through. */
export const AsLink: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <a href="#a" className={buttonVariants({ variant: "primary" })}>
        Get started <Icon icon={ArrowRight} />
      </a>
      <a href="#b" className={buttonVariants()}>
        <Icon icon={Download} /> Download
      </a>
      <a href="" className={buttonVariants({ variant: "link" })}>
        A visited link-style link
      </a>
    </div>
  ),
};

/** On a phone: lg, full width, stacked. */
export const Block: Story = {
  parameters: { viewport: { defaultViewport: "iphoneSE" } },
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Button size="lg" variant="primary" block>
        Continue
      </Button>
      <Button size="lg" block>
        Not now
      </Button>
    </div>
  ),
};
