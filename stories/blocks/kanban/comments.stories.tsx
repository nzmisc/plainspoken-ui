import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { CommentBox, KanbanComments } from "@/registry/plainspoken/blocks/kanban/comments";

const meta: Meta<typeof KanbanComments> = {
  title: "Blocks/Kanban/Comments",
  component: KanbanComments,
  args: { defaultComments: CARDS_BY_ID["FA-110"].comments },
  decorators: [(S) => <div className="max-w-xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof KanbanComments>;

/** Four comments with mentions; the one of you (Rosa) is outlined. Your own comment has a ⋯ menu. Write one and it joins the thread. */
export const Thread: Story = {};

/** Fourteen comments from thirteen people: the latest five show, with "Show 9 earlier comments" above them. */
export const LongThread: Story = { args: { defaultComments: CARDS_BY_ID["FA-119"].comments } };

/** Editing your own comment in place: Save, Cancel, or Escape. */
export const Editing: Story = { args: { defaultEditing: "m2" } };

/** No comments yet. */
export const Empty: Story = { args: { defaultComments: [] } };

/** The box suggesting people for an "@" just typed (it has focus): ↑ ↓ choose, Enter or Tab puts the name in. */
export const Mentioning: StoryObj<typeof CommentBox> = {
  render: () => <CommentBox onSubmit={() => {}} defaultValue="Ready for review. @h" autoFocus />,
};
