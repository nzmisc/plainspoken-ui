import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Copy, Download, ExternalLink, Pencil, Trash } from "@/registry/plainspoken/lib/icons";
import { ContextMenu, type MenuItem } from "@/registry/plainspoken/ui/context-menu";

/**
 * Right-click (or long-press on a touch screen) anywhere in the area. From the keyboard: focus a
 * row and press Shift+F10 or the Menu key; the menu opens at that row. Inside, the keys are as in
 * Dropdown menu. Escape or a click outside closes it and focus goes back where it was.
 */
const meta = {
  title: "Components/Overlays/Context menu",
  component: ContextMenu,
  decorators: [(Story) => <div className="min-h-80">{Story()}</div>],
} satisfies Meta<typeof ContextMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

const log = (what: string) => () => console.log("context menu:", what);

const rowItems = (name: string): MenuItem[] => [
  { type: "label", label: name },
  { label: "Open", icon: ExternalLink, onSelect: log(`open ${name}`) },
  { label: "Copy link", icon: Copy, shortcut: "⌘L", onSelect: log("copy") },
  { label: "Download", icon: Download, onSelect: log("download") },
  { label: "Rename", icon: Pencil, shortcut: "F2", onSelect: log("rename") },
  { type: "separator" },
  { label: "Move to Trash", icon: Trash, destructive: true, onSelect: log("trash") },
];

const FILES = [
  ["Q3 budget.xlsx", "84 KB"],
  ["Brand guidelines.pdf", "2.1 MB"],
  ["Team photo.jpg", "3.4 MB"],
];

/** Right-click a row. The items are built from the row that was clicked (`items` as a function). */
export const OnRows: Story = {
  args: { children: null, items: [] },
  render: () => (
    <ContextMenu
      label="File actions"
      items={(t) => rowItems(t.closest<HTMLElement>("[data-name]")?.dataset.name ?? "this folder")}
      className="w-fit border border-border"
    >
      <table className="border-collapse text-[14px] [&_td]:px-2 [&_td]:py-1 [&_th]:border-b [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {FILES.map(([n, s]) => (
            <tr key={n} data-name={n} tabIndex={0} className="hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
              <td>{n}</td>
              <td className="text-right tabular-nums">{s}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContextMenu>
  ),
};

/** The menu as it looks when open. */
export const Open: Story = {
  tags: ["!autodocs"],
  args: {
    items: rowItems("Q3 budget.xlsx"),
    defaultPoint: { x: 140, y: 60 },
    className: "flex h-48 items-center justify-center border border-dashed border-border text-muted-foreground",
    children: "Right-click anywhere here",
  },
};

/** disabled: a right-click gets the browser's own menu. */
export const Disabled: Story = {
  args: {
    items: rowItems("Q3 budget.xlsx"),
    disabled: true,
    className: "flex h-48 items-center justify-center border border-dashed border-border text-muted-foreground",
    children: "Right-click here: the browser's menu",
  },
};
