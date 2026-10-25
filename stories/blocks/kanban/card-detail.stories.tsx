import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID, COLUMNS } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCardDetail } from "@/registry/plainspoken/blocks/kanban/card-detail";

const meta: Meta<typeof KanbanCardDetail> = {
  title: "Blocks/Kanban/Card dialog",
  component: KanbanCardDetail,
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  args: { card: CARDS_BY_ID["FA-110"], columns: COLUMNS, onClose: () => {}, link: "https://corkboard.example/b/ferry-app-3-2?card=FA-110", onArchive: () => {} },
  argTypes: { card: { control: false }, columns: { control: false } },
  decorators: [(S) => <div className="min-h-[720px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof KanbanCardDetail>;

/**
 * The seat map card: status, priority, due date, two people and two labels on the side, with the
 * participants as a row of round avatars; the description, checklist, files and comments in the
 * middle. It keeps its own copy here: change anything and the Activity tab grows.
 */
export const Default: Story = {};

/** Six people assigned (all listed by name), 23 participants behind "+17", and 14 comments folded to the latest five. */
export const ManyPeople: Story = { args: { card: CARDS_BY_ID["FA-119"] } };

/** Overdue: the date's line under the picker is red and says how late. */
export const Overdue: Story = { args: { card: CARDS_BY_ID["FA-112"] } };

/** Little on it: no checklist, no files, no comments, nobody assigned. */
export const NoAttachments: Story = { args: { card: CARDS_BY_ID["FA-139"] } };

/** Editing the description. */
export const EditingDescription: Story = { args: { defaultEditingDescription: true } };

/** The Activity tab first. */
export const Activity: Story = { args: { defaultTab: "activity" } };

/** As a drawer the height of the screen, as on phones. */
export const Drawer: Story = { args: { layout: "drawer" } };

/** On a phone: the drawer fills the screen, the side column comes first. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
