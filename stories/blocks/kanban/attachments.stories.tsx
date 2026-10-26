import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanAttachments } from "@/registry/plainspoken/blocks/kanban/attachments";

const meta: Meta<typeof KanbanAttachments> = {
  title: "Blocks/Kanban/Attachments",
  component: KanbanAttachments,
  args: { defaultAttachments: CARDS_BY_ID["FA-110"].attachments, cover: "f-seat" },
  decorators: [(S) => <div className="max-w-xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof KanbanAttachments>;

/**
 * Three files, the picture marked as the cover. Click a file for its preview; ⋯ for Make cover
 * and Remove (which asks first). Add your own: they "upload" with progress, then join the list
 * with their real thumbnail and a Download, and never leave the browser.
 */
export const Default: Story = {};

/** No attachments yet: a line saying so, and the upload. */
export const NoAttachments: Story = { args: { defaultAttachments: [], cover: null } };

/** Every kind of symbol: text, video, picture, archive, spreadsheet, code, document. */
export const FileKinds: Story = {
  args: {
    cover: null,
    defaultAttachments: [...CARDS_BY_ID["FA-102"].attachments, ...CARDS_BY_ID["FA-108"].attachments, ...CARDS_BY_ID["FA-140"].attachments, ...CARDS_BY_ID["FA-121"].attachments, ...CARDS_BY_ID["FA-115"].attachments],
  },
};

/** Read only: the list and its previews, no upload or remove. */
export const ReadOnly: Story = { args: { readOnly: true } };
