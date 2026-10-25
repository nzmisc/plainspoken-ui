import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { merge3 } from "@/registry/plainspoken/lib/diff";
import { MergeConflict, MergedText } from "@/registry/plainspoken/ui/merge-conflict";
import { PresenceAvatar, type Collaborator } from "@/registry/plainspoken/ui/presence";

const AMARA: Collaborator = { id: "amara", name: "Amara Osei", color: 1 };
const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
const BASE = "The spring sale starts on Friday 14 March at 09:00.";

const meta = {
  title: "Components/Feedback/Merge conflict",
  component: MergeConflict,
  args: {
    base: BASE,
    mine: { text: "The spring sale starts on Friday 14 March at 08:00.", label: "Yours", mark: <PresenceAvatar person={AMARA} size={16} /> },
    theirs: { text: "The spring sale starts on Friday 14 March at 10:00, after the stand-up.", label: "Jonas Weber", mark: <PresenceAvatar person={JONAS} size={16} />, meta: "2 min ago" },
    labels: { theirs: "Keep Jonas's" },
    variant: "block",
    onResolve: () => {},
  },
  argTypes: { mine: { control: false }, theirs: { control: false }, renderText: { control: false }, variant: { control: "inline-radio", options: ["block", "inline"] } },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof MergeConflict>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both versions, tagged by author, each with its change marked against the base. Keyboard: Tab to
 * the buttons; Edit opens a text box with both versions in it (Escape cancels, Done keeps it).
 */
export const Playground: Story = {};

/** Without a base there is nothing to mark against: the versions show as they are. */
export const WithoutBase: Story = { args: { base: undefined } };

/** Fewer choices, a counter and another title, for a list of several. */
export const ChoicesAndCounter: Story = { args: { choices: ["mine", "theirs"], counter: "2 of 3", title: "You both changed the start time" } };

/** One side removed the text: it says so rather than showing an empty box. */
export const OneSideRemoved: Story = { args: { mine: { text: "", label: "Yours" } } };

/** Inline, for a few words in running text: small buttons right after the marked words. */
export const Inline: Story = {
  render: function Render() {
    const [day, setDay] = useState<string | null>(null);
    return (
      <p className="text-[14px] leading-[1.9]">
        We should fix this before the spring sale starts on{" "}
        {day ?? (
          <MergeConflict variant="inline" mine={{ text: "Thursday", label: "You" }} theirs={{ text: "Monday", label: "Jonas" }} labels={{ theirs: "Jonas's" }} onResolve={setDay} />
        )}
        .
      </p>
    );
  },
};

/** A whole merge with its clashes in place; settling one moves focus to the next, the last hands back the text. */
export const WholeMerge: Story = {
  render: function Render() {
    const [done, setDone] = useState<string | null>(null);
    const result = merge3(
      "Expected: the email is sent again. We should fix this before the sale on Friday. It happens on web.",
      "Expected: the email is sent again, at once. We should fix this before the sale on Thursday. It happens on web only.",
      "Expected: the email is sent again. We should fix this before the sale starts on Monday. It happens on web and iOS.",
    );
    return done ? (
      <p className="text-[14px]">Finished: {done}</p>
    ) : (
      <MergedText result={result} mineLabel="You" theirsLabel="Jonas" labels={{ theirs: "Jonas's" }} theirsClassName="bg-chart-2/20" onDone={setDone} />
    );
  },
};
