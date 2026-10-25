"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countWords, markdownToText } from "@/registry/plainspoken/lib/markdown";
import { EDITOR_NOW, ME, fakeImageUpload, personName, type DocStatus, type EditorDoc } from "@/registry/plainspoken/blocks/editor/data";
import { EditorDocumentHeader } from "@/registry/plainspoken/blocks/editor/document-header";
import { RichTextEditor, type EditorMode, type ImageUploadFunction } from "@/registry/plainspoken/ui/rich-text-editor";
import { cn } from "@/lib/utils";

export interface EditorDocumentProps {
  doc: EditorDoc;
  /** Called after each (pretend) save, with the page as it is now */
  onSave?: (doc: EditorDoc) => void;
  onDuplicate?: (doc: EditorDoc) => void;
  onDelete?: (doc: EditorDoc) => void;
  /** Stores pictures. Default: the demo's pretend upload, about two seconds with progress. */
  onUploadImage?: ImageUploadFunction;
  defaultMode?: EditorMode;
  /** The demo's clock, for "saved … ago" until the first save */
  now?: string;
  className?: string;
}

/**
 * One handbook page being edited: the header (title, status, words, last saved) over the rich text
 * editor, in a column that fills its container and scrolls the text on its own. Changes "save" a
 * moment after the typing stops: "Saving…", then "Saved just now by you". It is a picture of
 * saving; nothing is stored.
 */
export function EditorDocument({ doc, onSave, onDuplicate, onDelete, onUploadImage = fakeImageUpload, defaultMode, now = EDITOR_NOW, className }: EditorDocumentProps) {
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState<DocStatus>(doc.status);
  const [body, setBody] = useState(doc.body);
  const [saved, setSaved] = useState({ at: doc.savedAt, by: doc.savedBy, live: false });
  const [saving, setSaving] = useState(false);
  const latest = useRef({ ...doc });
  const timer = useRef(0);
  const words = useMemo(() => countWords(`${title}\n${markdownToText(body)}`), [title, body]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (patch: Partial<EditorDoc>) => {
    latest.current = { ...latest.current, ...patch };
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const at = new Date().toISOString();
      latest.current = { ...latest.current, savedAt: at, savedBy: ME.id };
      setSaving(false);
      setSaved({ at, by: ME.id, live: true });
      onSave?.(latest.current);
    }, 900);
  };

  return (
    <div data-slot="editor-document" className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <EditorDocumentHeader
        title={title}
        onTitleChange={(t) => {
          setTitle(t);
          change({ title: t });
        }}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          change({ status: s });
        }}
        section={doc.section}
        words={words}
        save={saving ? { saving: true } : { at: saved.at, by: saved.by === ME.id ? "you" : personName(saved.by), now: saved.live ? undefined : now }}
        onCopyMarkdown={() => void navigator.clipboard?.writeText(latest.current.body)}
        onDuplicate={() => onDuplicate?.(latest.current)}
        onDelete={() => onDelete?.(latest.current)}
      />
      <RichTextEditor
        aria-label={`${title || "Untitled"}: text`}
        value={body}
        onChange={(md) => {
          setBody(md);
          change({ body: md });
        }}
        defaultMode={defaultMode}
        placeholder="Start writing, or type # for a heading, - for a list"
        onUploadImage={onUploadImage}
        measure
        size="sm"
        className="min-h-0 flex-1 border-0 has-[[data-rte-input]:focus-visible]:-outline-offset-2"
        contentClassName="min-h-0"
      />
    </div>
  );
}
