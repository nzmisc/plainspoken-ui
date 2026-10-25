import { Bold, Italic, Link, List, ListOrdered, Quote, Underline } from "@/registry/plainspoken/lib/icons";
import { ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";

const GROUPS = [
  [
    { icon: Bold, label: "Bold", keys: "Ctrl+B" },
    { icon: Italic, label: "Italic", keys: "Ctrl+I" },
    { icon: Underline, label: "Underline", keys: "Ctrl+U" },
  ],
  [
    { icon: List, label: "Bulleted list", keys: "Ctrl+Shift+8" },
    { icon: ListOrdered, label: "Numbered list", keys: "Ctrl+Shift+7" },
    { icon: Quote, label: "Quote", keys: "Ctrl+Shift+9" },
    { icon: Link, label: "Insert link", keys: "Ctrl+K" },
  ],
];

/** A toolbar of icon buttons: hover one, or Tab to it. Once one tooltip shows, moving to the next shows it at once. */
export default function TooltipDemo() {
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-2">
      {GROUPS.map((g, i) => (
        <ButtonGroup key={i} label={i === 0 ? "Text style" : "Blocks"} size="sm">
          {g.map((b) => (
            <Tooltip key={b.label} content={`${b.label} (${b.keys})`}>
              <IconButton icon={b.icon} label={b.label} />
            </Tooltip>
          ))}
        </ButtonGroup>
      ))}
    </div>
  );
}
