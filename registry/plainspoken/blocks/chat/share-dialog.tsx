"use client";

import { useEffect, useState } from "react";
import type { ChatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { SHARE_KEY, SHARE_MAX_BYTES, SHARE_WARN_BYTES, canShare, encodeShare, sharedOf } from "@/registry/plainspoken/blocks/chat/share";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { formatSize } from "@/registry/plainspoken/ui/file-upload";
import { Input } from "@/registry/plainspoken/ui/input";
import { TextLink } from "@/registry/plainspoken/ui/text-link";

export interface ChatShareDialogProps {
  open: boolean;
  onClose: () => void;
  conversation: ChatConversation | null;
  /** The page the link opens: the chat's own address by default */
  baseUrl?: string;
}

function ShareBody({ conversation, baseUrl }: { conversation: ChatConversation; baseUrl?: string }) {
  const docs = conversation.artifacts?.length ?? 0;
  const files = conversation.messages.reduce((n, m) => n + m.parts.filter((p) => p.type === "file").length, 0);
  const hasReasoning = conversation.messages.some((m) => m.parts.some((p) => p.type === "reasoning"));
  const [documents, setDocuments] = useState(true);
  const [reasoning, setReasoning] = useState(false);
  const [link, setLink] = useState<{ url: string; bytes: number } | null>(null);
  const supported = canShare();

  useEffect(() => {
    if (!supported) return;
    let live = true;
    void encodeShare(sharedOf(conversation, { documents, reasoning })).then((data) => {
      if (!live) return;
      const base = baseUrl ?? `${location.origin}${location.pathname}`;
      const url = `${base}#${SHARE_KEY}=${data}`;
      setLink({ url, bytes: new TextEncoder().encode(url).length });
    });
    return () => {
      live = false;
    };
  }, [conversation, documents, reasoning, baseUrl, supported]);

  if (!supported) return <Alert variant="warning">This browser can&apos;t make share links: it has no CompressionStream.</Alert>;
  const tooLong = !!link && link.bytes > SHARE_MAX_BYTES;
  return (
    <div className="flex flex-col gap-3">
      <p>
        Anyone with the link can read this conversation, as it is now. Everything is in the link itself, after the #, which browsers don&apos;t send to a server:
        nothing is uploaded.{files > 0 && ` The ${files === 1 ? "attached file isn't" : `${files} attached files aren't`} included, only their names.`}
      </p>
      <div className="flex flex-col gap-1">
        {docs > 0 && <Checkbox label={`Include the ${docs === 1 ? "document" : `${docs} documents`} (latest versions)`} checked={documents} onChange={(e) => setDocuments(e.target.checked)} />}
        {hasReasoning && <Checkbox label="Include the model's reasoning" checked={reasoning} onChange={(e) => setReasoning(e.target.checked)} />}
      </div>
      {tooLong ? (
        <Alert variant="warning" title="Too long for a link">
          At {formatSize(link.bytes)} this conversation is more than a link can safely hold ({formatSize(SHARE_MAX_BYTES)}). Leave out the documents or the reasoning, or export it as a file
          instead.
        </Alert>
      ) : (
        <>
          <div className="flex gap-2">
            <Input aria-label="Link to this conversation" readOnly value={link?.url ?? "Making the link…"} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 font-mono" data-autofocus />
            <CopyButton text={link?.url ?? ""} label="Copy link" size="md" variant="primary" />
          </div>
          {link && (
            <p className="text-[13px] text-muted-foreground">
              The link is {formatSize(link.bytes)}.{" "}
              {link.bytes > SHARE_WARN_BYTES ? "Some apps cut links this long when they are pasted: if it doesn't open, send it by email, or export the conversation as a file." : "Short enough to paste anywhere."}{" "}
              <TextLink href={link.url} external>
                Open it
              </TextLink>
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Shares a conversation as a link, with no server: the conversation is compressed into the part
 * of the address after the #, which never leaves the browser that opens it. It opens read-only,
 * with Save a copy. Files are left out (only their names go), and documents and reasoning are
 * choices. The dialog says how long the link is, warns when some apps may cut it, and refuses one
 * too long to work.
 */
export function ChatShareDialog({ open, onClose, conversation, baseUrl }: ChatShareDialogProps) {
  return (
    <Dialog
      open={open && conversation != null}
      onClose={onClose}
      title="Share as a link"
      footer={
        <Button onClick={onClose}>Done</Button>
      }
    >
      {conversation && <ShareBody conversation={conversation} baseUrl={baseUrl} />}
    </Dialog>
  );
}
