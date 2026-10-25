import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Calendar, FilePlus, Inbox, Keyboard, Languages, MailPlus, Moon, Search, Settings, Upload, Users } from "@/registry/plainspoken/lib/icons";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Command, CommandDialog, useCommandShortcut, useModifierKey, type CommandGroup } from "@/registry/plainspoken/ui/command";
import { Kbd } from "@/registry/plainspoken/ui/kbd";

/**
 * Keyboard (the ARIA combobox pattern with a listbox): focus stays in the search box; ↑ and ↓
 * move the highlight and wrap; Enter runs the highlighted command; Escape clears the text, and
 * with nothing typed closes the dialog. ⌘K or Ctrl+K opens and closes the dialog from anywhere
 * (useCommandShortcut). The dialog story starts open and is left off the docs page.
 */
const meta = {
  title: "Components/Overlays/Command",
  component: Command,
  args: { groups: [] },
  argTypes: { size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] }, groups: { control: false } },
} satisfies Meta<typeof Command>;
export default meta;
type Story = StoryObj<typeof meta>;

const log = (what: string) => () => console.log("command:", what);

const GROUPS: CommandGroup[] = [
  {
    heading: "Create",
    items: [
      { label: "New message", icon: MailPlus, shortcut: ["⌘", "N"], onSelect: log("new message") },
      { label: "New event", icon: Calendar, keywords: ["meeting", "appointment"], onSelect: log("new event") },
      { label: "New document", icon: FilePlus, onSelect: log("new document") },
      { label: "Upload files", icon: Upload, hint: "up to 2 GB", onSelect: log("upload") },
    ],
  },
  {
    heading: "Go to",
    items: [
      { label: "Inbox", icon: Inbox, shortcut: ["G", "I"], onSelect: log("inbox") },
      { label: "Calendar", icon: Calendar, shortcut: ["G", "C"], onSelect: log("calendar") },
      { label: "Contacts", icon: Users, keywords: ["people", "address book"], onSelect: log("contacts") },
      { label: "Settings", icon: Settings, keywords: ["preferences"], shortcut: ["⌘", ","], onSelect: log("settings") },
    ],
  },
  {
    heading: "Preferences",
    items: [
      { label: "Switch to dark theme", icon: Moon, keywords: ["appearance"], onSelect: log("dark") },
      { label: "Change language", icon: Languages, hint: "English (UK)", onSelect: log("language") },
      { label: "Keyboard shortcuts", icon: Keyboard, shortcut: ["?"], onSelect: log("shortcuts") },
      { label: "Import from another app", icon: Upload, hint: "Coming soon", disabled: true, onSelect: log("import") },
    ],
  },
];

/** Inline, in the page. Type “meet”, “people” or “dark”: keywords count too. */
export const Inline: Story = { args: { groups: GROUPS, className: "max-w-md" } };

/** With text typed: matches are bold and underlined, best first within each group. */
export const Filtered: Story = { args: { groups: GROUPS, defaultSearch: "new", className: "max-w-md" } };

/** Nothing matches. */
export const Empty: Story = { args: { groups: GROUPS, defaultSearch: "invoice", className: "max-w-md" } };

/** Waiting for results from somewhere else. */
export const Loading: Story = { args: { groups: [], defaultSearch: "han", loading: true, filter: false, className: "max-w-md" } };

/** Rows take the surrounding size; here every size, side by side. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-3">
      {CONTROL_SIZES.map((s) => (
        <Command key={s} size={s} groups={GROUPS.slice(1, 2)} label={`Go to (${s})`} placeholder={`Size ${s}`} className="w-60" />
      ))}
    </div>
  ),
};

function DialogDemo({ initial }: { initial: boolean }) {
  const [open, setOpen] = useState(initial);
  const mod = useModifierKey();
  useCommandShortcut(() => setOpen((o) => !o));
  return (
    <>
      <Button icon={Search} onClick={() => setOpen(true)}>
        Search <Kbd keys={[mod, "K"]} className="ml-2 text-[12px]" />
      </Button>
      <CommandDialog open={open} onClose={() => setOpen(false)} groups={GROUPS} />
    </>
  );
}

/** The palette in a modal dialog. Press ⌘K or Ctrl+K, or click the button. */
export const InDialog: Story = { render: () => <DialogDemo initial={false} /> };

/** Open on load. */
export const InDialogOpen: Story = { tags: ["!autodocs"], render: () => <DialogDemo initial /> };

/** On a phone the dialog fills the screen and has a close button, since there's no Escape key. */
export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "iphoneSE" } }, render: () => <DialogDemo initial /> };
