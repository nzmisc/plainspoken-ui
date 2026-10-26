import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { diffWords, merge3, mergedText } from "@/registry/plainspoken/lib/diff";
import { Diff, DiffLegend, DiffText } from "@/registry/plainspoken/ui/diff";

const BEFORE = "Returns are free within 14 days of delivery, as long as the parcel is unopened.";
const AFTER = "Returns are free within 30 days of delivery, as long as the item is unused and in its box.";

const meta = {
  title: "Components/Data display/Diff",
  component: Diff,
  args: { before: BEFORE, after: AFTER, granularity: "word", layout: "inline", beforeLabel: "Before", afterLabel: "After" },
  argTypes: {
    granularity: { control: "inline-radio", options: ["char", "word", "line"] },
    layout: { control: "inline-radio", options: ["inline", "split"] },
    parts: { control: false },
  },
  decorators: [(S) => <div className="max-w-3xl"><S /></div>],
} satisfies Meta<typeof Diff>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Side by side: the old text keeps its deletions, the new one its insertions. Stacked below 640px. */
export const Split: Story = { args: { layout: "split", beforeLabel: "Version 3, saved by Jonas", afterLabel: "Your version" } };

/** Characters, words and lines on the same change. Words fold the spaces between changed words into one change. */
export const Granularities: Story = {
  render: () => {
    const a = "colour: grey;\nmargin: 0 auto;\npadding: 4px;\n";
    const b = "color: gray;\nmargin: 0 auto;\npadding: 6px 4px;\n";
    return (
      <div className="flex flex-col gap-3 font-mono text-[13px]">
        {(["char", "word", "line"] as const).map((g) => (
          <section key={g}>
            <h3 className="font-sans text-[13px] font-semibold">{g}</h3>
            <Diff before={a} after={b} granularity={g} />
          </section>
        ))}
      </div>
    );
  },
};

/** The same texts: "No changes.", unless showEmpty is off, when the text shows unmarked. */
export const NoChanges: Story = { args: { before: BEFORE, after: BEFORE } };

/** Only spaces or a line break changed: a ¶ or a middle dot makes the change visible (screen readers skip them). */
export const Whitespace: Story = { args: { before: "First line. Second line.", after: "First line.\nSecond  line." } };

/** A long text wraps, keeping its line breaks. */
export const LongText: Story = {
  args: {
    before:
      "When a customer changes the delivery address after checkout, the confirmation email still shows the old address. It happens on web and in the app.\n\nExpected: the email is sent again with the new address, or the change is blocked once the parcel is packed. We should fix this before the spring sale on Friday.",
    after:
      "When a customer changes the delivery address after checkout, the confirmation email still shows the old address. It happens on web and in the iOS app, but not on Android.\n\nExpected: the email is sent again with the new address, or the change is blocked once the parcel is packed. We should fix this before the spring sale on Thursday.",
  },
};

/** DiffText on its own, from parts worked out with lib/diff, inside your own markup. */
export const PartsInRunningText: Story = {
  render: () => (
    <p className="text-[14px]">
      Jonas changed the start: <DiffText parts={diffWords("at 09:00", "at 10:00, after the stand-up")} />.
    </p>
  ),
};

/** lib/diff's three-way merge settled three ways, with the legend for the marks. */
export const ThreeWayMerge: Story = {
  render: () => {
    const r = merge3("sale on Friday.", "sale on Thursday.", "sale starts on Monday.");
    return (
      <div className="flex flex-col gap-1 text-[14px]">
        <p>Mine: {mergedText(r, "mine")}</p>
        <p>Theirs: {mergedText(r, "theirs")}</p>
        <p>Both: {mergedText(r, "both")}</p>
        <DiffLegend className="mt-2" />
      </div>
    );
  },
};
