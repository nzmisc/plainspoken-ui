import type { PictureKind } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanPicture } from "@/registry/plainspoken/blocks/kanban/picture";

const KINDS: [PictureKind, string][] = [
  ["seat-map", "Seat map"],
  ["screens", "Phone screens"],
  ["form", "A form"],
  ["map", "Sea map"],
  ["icons", "App icons"],
  ["chart", "Chart"],
];

/** Every stand-in picture, at the size a card cover uses. Switch to dark mode: they follow. */
export default function KanbanPictureDemo() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {KINDS.map(([kind, name]) => (
        <li key={kind} className="flex flex-col gap-1">
          <KanbanPicture kind={kind} className="h-24 w-full border border-border" />
          <span className="text-[13px] text-muted-foreground">{name}</span>
        </li>
      ))}
    </ul>
  );
}
