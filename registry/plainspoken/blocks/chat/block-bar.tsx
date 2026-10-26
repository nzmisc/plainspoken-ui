import type { ReactNode } from "react";
import { Maximize2 } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { cn } from "@/lib/utils";

export interface ChatBlockBarProps {
  /** What the block is, in small mono type: the code's language, "table", "mermaid" */
  label: ReactNode;
  /** Small print after the label: "6 rows" */
  detail?: ReactNode;
  /** Buttons at the right (xs, ghost): Copy */
  children?: ReactNode;
  /** Adds a Full screen button */
  onFullscreen?: () => void;
  className?: string;
}

/**
 * The thin bar over a block in an answer (code, a table, a diagram): what it is on the left, its
 * buttons on the right, and Full screen last when the block can be opened large.
 */
export function ChatBlockBar({ label, detail, children, onFullscreen, className }: ChatBlockBarProps) {
  return (
    <div data-slot="chat-block-bar" className={cn("ctl-xs flex min-h-7 items-center gap-2 border-b border-border bg-muted pr-0.5 pl-2 font-sans", className)}>
      <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
        <span className="font-mono">{label}</span>
        {detail && <span className="ml-2">{detail}</span>}
      </span>
      <span className="flex shrink-0 items-center">
        {children}
        {onFullscreen && <IconButton variant="ghost" icon={Maximize2} label="Full screen" onClick={onFullscreen} />}
      </span>
    </div>
  );
}

export interface ChatFullViewProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Buttons for the footer: Copy, Download */
  actions?: ReactNode;
  /** Classes for the scrolling body */
  bodyClassName?: string;
}

/** A block of an answer opened large: the library's Dialog at its full size, with the block's own actions at the bottom */
export function ChatFullView({ open, onClose, title, children, actions, bodyClassName }: ChatFullViewProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="full" bodyClassName={bodyClassName} footer={actions && <div className="ctl-sm flex flex-wrap justify-end gap-2">{actions}</div>}>
      {children}
    </Dialog>
  );
}
