import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanAttachments } from "@/registry/plainspoken/blocks/kanban/attachments";

/**
 * Three files, the seat map as the card's cover. Click one to preview it. Add your own files: they
 * "upload" with progress, then join the list with their own thumbnail, and only ever stay in this
 * browser tab.
 */
export default function KanbanAttachmentsDemo() {
  const card = CARDS_BY_ID["FA-110"];
  return <KanbanAttachments defaultAttachments={card.attachments} cover={card.cover} className="max-w-xl" />;
}
