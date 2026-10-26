import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { countViews, GRID_VIEWS, GridViews, type GridView } from "@/registry/plainspoken/blocks/grid/views";

const COUNTS = countViews(GRID_VIEWS);

const meta: Meta<typeof GridViews> = {
  title: "Blocks/Data grid/Saved views",
  component: GridViews,
  args: { views: GRID_VIEWS, activeId: "all", counts: COUNTS, onSelect: () => {} },
};
export default meta;
type Story = StoryObj<typeof GridViews>;

/** The shop's three views with their row counts; the current one bold and underlined (aria-current). Tab between them, Enter to switch. */
export const Views: Story = {
  render: function Render(args) {
    const [active, setActive] = useState(args.activeId);
    return <GridViews {...args} activeId={active} onSelect={setActive} />;
  },
};

/** The table was changed: "edited", with Revert and "Save as view" (a small form under the button). */
export const Edited: Story = { args: { activeId: "late", edited: true, onRevert: () => {}, onSave: () => {} } };

/** With views of your own, which have a × to delete them. */
export const WithSavedViews: Story = {
  render: function Render(args) {
    const [views, setViews] = useState<GridView[]>([
      ...GRID_VIEWS,
      { ...GRID_VIEWS[1], id: "late-np", name: "Late with Northpost", custom: true },
      { ...GRID_VIEWS[2], id: "big-paypal", name: "Big PayPal orders", custom: true },
    ]);
    const [active, setActive] = useState("late-np");
    return <GridViews {...args} views={views} counts={undefined} activeId={active} onSelect={setActive} onDelete={(id) => setViews((vs) => vs.filter((v) => v.id !== id))} />;
  },
};

/** At phone width the tabs scroll sideways. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { edited: true, onRevert: () => {}, onSave: () => {} } };
