"use client";

import { useId } from "react";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { CHAT_MODELS, chatModel, formatChatPrice, type ChatModel } from "@/registry/plainspoken/blocks/chat/models";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

export interface ChatModelPickerProps {
  /** The model's id */
  value: string;
  onChange: (id: string) => void;
  /** Default: the chat's allow-list */
  models?: ChatModel[];
  disabled?: boolean;
  size?: ControlSize;
  /** Show what the model costs next to it (hidden on phones). Default on. */
  showPrice?: boolean;
  /** What the next message needs: models that can't see pictures are offered disabled while pictures are attached */
  needs?: { images?: boolean };
  /** The accessible name. Default "Model". */
  label?: string;
  className?: string;
}

/**
 * Which model answers next: the browser's own select (the system picker on phones), the cheap
 * fast models in one group and the stronger one in another, with the price per million tokens
 * beside it, so the choice is made knowing the cost. With pictures attached, a model that can't
 * see them is offered disabled.
 */
export function ChatModelPicker({ value, onChange, models = CHAT_MODELS, disabled, size, showPrice = true, needs, label = "Model", className }: ChatModelPickerProps) {
  const id = useId();
  const current = chatModel(value);
  const group = (tier: ChatModel["tier"], label: string) => {
    const options = models
      .filter((m) => m.tier === tier)
      .map((m) => {
        const blind = !!needs?.images && !m.reads.images;
        return { value: m.id, label: blind ? `${m.name} (can't see pictures)` : m.name, disabled: blind && m.id !== value };
      });
    return options.length ? [{ group: label, options }] : [];
  };
  return (
    <span data-slot="chat-model-picker" className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select
        id={id}
        size={size}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        options={[...group("fast", "Fast and cheap"), ...group("strong", "Stronger, dearer")]}
        aria-describedby={showPrice && current ? `${id}-price` : undefined}
      />
      {showPrice && current && (
        <span id={`${id}-price`} className="truncate text-[12px] text-muted-foreground tabular-nums max-sm:hidden">
          {formatChatPrice(current)}
          <span className="sr-only"> per million tokens</span>
          <span aria-hidden> / M tokens</span>
        </span>
      )}
    </span>
  );
}
