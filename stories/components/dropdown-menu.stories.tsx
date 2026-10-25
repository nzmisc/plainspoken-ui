import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Archive, Ellipsis, ExternalLink, Forward, MailOpen, Pin, Reply, ReplyAll, Tag, Trash } from "@/registry/plainspoken/lib/icons";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Measure } from "../support/measure";

/**
 * Keyboard (the ARIA menu button pattern): ↓, Enter or Space on the button opens the menu on the
 * first item, ↑ on the last. ↑ and ↓ move and wrap, Home and End jump, letters jump to the next
 * item starting with them, → opens a submenu and ← closes it, Enter or Space chooses, Escape
 * closes one level and puts focus back, Tab closes everything and moves on. The pointer moves the
 * highlight too. Stories that start open are left off the docs page.
 */
const meta = {
  title: "Components/Overlays/Dropdown menu",
  component: DropdownMenu,
  args: { trigger: "Actions", chevron: true, items: [] },
  argTypes: {
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    triggerVariant: { control: "select", options: ["default", "primary", "secondary", "outline", "ghost"] },
    align: { control: "select", options: ["start", "end"] },
    side: { control: "select", options: ["bottom", "top"] },
    trigger: { control: "text" },
    items: { control: false },
  },
  decorators: [(Story) => <div className="min-h-96">{Story()}</div>],
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

const log = (what: string) => () => console.log("menu:", what);

const actions: MenuItem[] = [
  { label: "Reply", icon: Reply, shortcut: "R", onSelect: log("reply") },
  { label: "Reply all", icon: ReplyAll, shortcut: "⇧R", onSelect: log("reply all") },
  { label: "Forward", icon: Forward, shortcut: "F", onSelect: log("forward") },
  { type: "separator" },
  { label: "Mark as unread", icon: MailOpen, shortcut: "⇧U", onSelect: log("unread") },
  { label: "Pin to top", icon: Pin, onSelect: log("pin") },
  {
    type: "submenu",
    label: "Label as",
    icon: Tag,
    items: [
      { label: "Clients", onSelect: log("clients") },
      { label: "Invoices", hint: "Also forwards to accounts@", onSelect: log("invoices") },
      { label: "Travel", onSelect: log("travel") },
      { label: "Archived label", disabled: true },
    ],
  },
  { label: "Open in new window", icon: ExternalLink, href: "#message" },
  { label: "Move to folder…", icon: Archive, disabled: true, hint: "No folders yet" },
  { type: "separator" },
  { label: "Delete", icon: Trash, shortcut: "#", destructive: true, onSelect: log("delete") },
];

/** Every simple prop in the Controls panel. Click the button, or focus it and press ↓. */
export const Playground: Story = { args: { items: actions } };

/** Actions with icons, shortcuts, a hint, a link, a submenu, a disabled item and a destructive one. Open on load. */
export const Open: Story = { tags: ["!autodocs"], args: { items: actions, defaultOpen: true } };

function ViewMenu({ defaultOpen }: { defaultOpen?: boolean }) {
  const [cols, setCols] = useState({ Customer: true, Status: true, Items: false, Total: true });
  const [sort, setSort] = useState("newest");
  const [density, setDensity] = useState("compact");
  const items: MenuItem[] = [
    { type: "label", label: "Columns" },
    ...(Object.keys(cols) as (keyof typeof cols)[]).map((k): MenuItem => ({ type: "checkbox", label: k, checked: cols[k], onCheckedChange: (v) => setCols({ ...cols, [k]: v }) })),
    { type: "separator" },
    {
      type: "radio",
      label: "Sort by",
      value: sort,
      onValueChange: setSort,
      options: [
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
        { value: "total", label: "Largest total", disabled: true },
      ],
    },
    { type: "separator" },
    {
      type: "submenu",
      label: "Row height",
      items: [
        {
          type: "radio",
          value: density,
          onValueChange: setDensity,
          options: [
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfortable" },
          ],
        },
      ],
    },
  ];
  return (
    <div className="flex flex-col items-start gap-2">
      <DropdownMenu trigger="View" chevron items={items} defaultOpen={defaultOpen} />
      <code className="font-mono text-[12px] text-muted-foreground">{JSON.stringify({ cols, sort, density })}</code>
    </div>
  );
}

/** Checkbox and radio items stay open when chosen, so several can be flipped in a row. */
export const CheckboxesAndRadios: Story = { render: () => <ViewMenu /> };

/** The same, open. */
export const CheckboxesAndRadiosOpen: Story = { tags: ["!autodocs"], render: () => <ViewMenu defaultOpen /> };

/** A ⋯ menu aligned to the button's end, as at the end of a table row. */
export const AlignEnd: Story = {
  tags: ["!autodocs"],
  args: { trigger: Ellipsis, label: "More actions", triggerVariant: "ghost", items: actions.slice(0, 3), align: "end", defaultOpen: true },
  decorators: [(Story) => <div className="flex justify-end">{Story()}</div>],
};

/** The menu takes the trigger's size: from an xs or sm trigger its rows are 20 or 24px. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <DropdownMenu size={s} trigger={`Menu ${s}`} chevron items={actions} />
            <Button size={s}>Button {s}</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** Opened from a status bar at the bottom: side="top". It flips by itself when there's no room. */
export const Above: Story = {
  tags: ["!autodocs"],
  args: { items: actions.slice(0, 5), side: "top", defaultOpen: true },
  decorators: [(Story) => <div className="flex min-h-96 items-end">{Story()}</div>],
};

/** A long menu scrolls inside the window instead of running off it. */
export const Long: Story = {
  tags: ["!autodocs"],
  args: {
    trigger: "Time zone",
    defaultOpen: true,
    items: ["Auckland", "Sydney", "Tokyo", "Seoul", "Shanghai", "Singapore", "Bangkok", "Kolkata", "Dubai", "Moscow", "Istanbul", "Athens", "Berlin", "Paris", "London", "Lisbon", "Reykjavík", "São Paulo", "New York", "Chicago", "Denver", "Los Angeles", "Anchorage", "Honolulu"].map((label) => ({ label })),
  },
  globals: { viewport: { value: "iphoneSE" } },
};

/** Your own trigger, from a function: spread the props onto a <button>. */
export const CustomTrigger: Story = {
  args: {
    items: actions.slice(0, 3),
    trigger: (props) => (
      <button {...props} className="cursor-pointer text-link underline visited:text-link-visited">
        Message actions
      </button>
    ),
  },
};


/** disabled: the button is disabled and the menu never opens, even with `open` set. A custom trigger gets `disabled` to draw its own. */
export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <DropdownMenu trigger="Actions" chevron items={actions} disabled />
      <DropdownMenu trigger={Ellipsis} label="More actions" items={actions} disabled open />
      <DropdownMenu
        items={actions}
        disabled
        trigger={(props) => (
          <button {...props} className="cursor-pointer text-link underline visited:text-link-visited disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline">
            Message actions
          </button>
        )}
      />
    </div>
  ),
};
