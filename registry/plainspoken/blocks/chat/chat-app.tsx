"use client";

import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from "react";
import { useChat } from "@ai-sdk/react";
import { generateId, type ChatTransport } from "ai";
import {
  BookText,
  Braces,
  Brain,
  Columns2,
  Ellipsis,
  FileDown,
  Keyboard,
  Key,
  MessageSquareDashed,
  Pencil,
  Pin,
  PinOff,
  Search,
  Share2,
  SquarePen,
  Trash,
  Upload,
  X,
} from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { useStoredState } from "@/registry/plainspoken/hooks/use-stored-state";
import { useToday } from "@/registry/plainspoken/hooks/use-today";
import {
  CHAT_PROMPTS,
  CHAT_SUGGESTIONS,
  type ChatArtifact,
  type ChatConversation,
  type ChatMessage,
  type ChatPart,
  type ChatPrompt,
  type ChatTree,
} from "@/registry/plainspoken/blocks/chat/data";
import { chatErrorOf, conversationMatches, isToolPart, messageText, titleFrom } from "@/registry/plainspoken/blocks/chat/format";
import { CHAT_MODELS, DEFAULT_CHAT_MODEL, chatModel, chatModelName, isChatModel } from "@/registry/plainspoken/blocks/chat/models";
import { applyToolCall, draftOf, type DocumentToolOutput } from "@/registry/plainspoken/blocks/chat/artifacts";
import { addSiblings, hasBranches, stashFrom, switchVersion, syncTree, versionsAt } from "@/registry/plainspoken/blocks/chat/branches";
import { decodeShare, shareInHash, type SharedConversation } from "@/registry/plainspoken/blocks/chat/share";
import { conversationJson, conversationMarkdown, exportFileName, parseImport } from "@/registry/plainspoken/blocks/chat/export";
import { chatTransport, stored, wireDocuments, type ChatUIMessage } from "@/registry/plainspoken/blocks/chat/transport";
import { downloadText, forgetAttachments, sendableUrl, storedUrl, type ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";
import { ChatDeleteDialog, ChatRenameDialog, chatSections } from "@/registry/plainspoken/blocks/chat/conversations";
import { ChatModelPicker } from "@/registry/plainspoken/blocks/chat/model-picker";
import { ChatThread } from "@/registry/plainspoken/blocks/chat/thread";
import type { ChatMessageBranch } from "@/registry/plainspoken/blocks/chat/message";
import { ChatArtifactPanel } from "@/registry/plainspoken/blocks/chat/artifact-panel";
import { ChatCompareView } from "@/registry/plainspoken/blocks/chat/compare-view";
import { ChatShareDialog } from "@/registry/plainspoken/blocks/chat/share-dialog";
import { ChatPromptFill, ChatPromptLibrary, promptBlanks, type ChatSlashItem } from "@/registry/plainspoken/blocks/chat/prompt-library";
import { ChatShortcutsDialog, isShortcut } from "@/registry/plainspoken/blocks/chat/shortcuts";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { toast } from "@/registry/plainspoken/ui/toast";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

export { chatTransport, type ChatUIMessage } from "@/registry/plainspoken/blocks/chat/transport";

interface Prefs {
  model: string;
  think: boolean;
  /** Showcase conversations that were deleted */
  hidden?: string[];
  /** The second model of a comparison */
  compareWith?: string;
}

/** What the / list can do besides the saved prompts */
type ChatAction = "new" | "temporary" | "compare" | "prompts" | "share" | "export" | "shortcuts";

const ACTIONS: (ChatSlashItem & { command: ChatAction })[] = [
  { key: "new", command: "new", title: "New chat", group: "Actions" },
  { key: "temporary", command: "temporary", title: "Temporary chat", description: "Not saved, not listed", group: "Actions" },
  { key: "compare", command: "compare", title: "Compare two models", description: "Both answer; keep the better one", group: "Actions" },
  { key: "prompts", command: "prompts", title: "Prompt library", description: "Your saved prompts", group: "Actions" },
  { key: "share", command: "share", title: "Share a link", description: "Read-only, in the address", group: "Actions" },
  { key: "export", command: "export", title: "Export as Markdown", group: "Actions" },
  { key: "shortcuts", command: "shortcuts", title: "Keyboard shortcuts", group: "Actions" },
];

/** Every document tool call in the messages applied, in order: once each (a version remembers its call) */
function withToolCalls(artifacts: ChatArtifact[], messages: ChatMessage[]): ChatArtifact[] {
  let next = artifacts;
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    for (const p of m.parts) if (isToolPart(p) && p.state === "output-available") next = applyToolCall(next, p, m.metadata?.createdAt ?? 0);
  }
  return next;
}

/** The document a tool call made or changed */
const documentOf = (p: ChatPart | null) => (p ? ((p.output as DocumentToolOutput | undefined)?.id ?? ((p.input as { id?: string } | undefined)?.id || undefined)) : undefined);

function fileParts(attachments: ChatAttachment[], keep: boolean) {
  const files = attachments.filter((a) => a.url).map((a) => ({ type: "file" as const, mediaType: a.mediaType, filename: a.name, url: keep ? storedUrl(a.url!) : a.url! }));
  const sizes = attachments.length ? Object.fromEntries(attachments.map((a) => [a.name, a.size])) : undefined;
  return { files, sizes };
}

/** What the app can ask of the open conversation */
export interface ChatSessionHandle {
  /** Put text in the message box (a prompt from the library) */
  insert: (text: string) => void;
  focus: () => void;
  /** The text of the last answer, or null */
  lastAnswer: () => string | null;
}

interface SessionProps {
  conversation: ChatConversation | null;
  prefs: Prefs;
  onPrefsChange: (p: Partial<Prefs>) => void;
  transport: ChatTransport<ChatUIMessage>;
  missingKey: boolean;
  onMissingKey: () => void;
  /** The first message of a new chat: make the conversation, return its id */
  onCreate: (firstText: string) => string;
  onSave: (id: string, patch: Pick<ChatConversation, "messages" | "tree" | "artifacts">, touched: boolean) => void;
  autoFocus: boolean;
  /** Conversations are remembered (in this browser) */
  saved: boolean;
  /** Not saved and not listed, until "Keep it" */
  temporary: boolean;
  onKeep: () => void;
  slash: ChatSlashItem[];
  onAction: (action: ChatAction) => void;
  onPrompt: (id: string) => void;
  handle: Ref<ChatSessionHandle>;
}

/**
 * One conversation, live: useChat with the conversation's messages to start from. A new chat has
 * no conversation until its first message is sent. Messages, their other versions and the
 * documents are saved whenever nothing streams, and once more when an answer finishes, even if the
 * conversation was closed meanwhile.
 */
function ChatSession({
  conversation,
  prefs,
  onPrefsChange,
  transport,
  missingKey,
  onMissingKey,
  onCreate,
  onSave,
  autoFocus,
  saved,
  temporary,
  onKeep,
  slash,
  onAction,
  onPrompt,
  handle,
}: SessionProps) {
  const idRef = useRef(conversation?.id ?? null);
  const root = useRef<HTMLDivElement>(null);
  const [tree, setTree] = useState<ChatTree | undefined>(conversation?.tree);
  // Your changes to the documents; the model's tool calls are applied over them as they arrive
  const [edits, setEdits] = useState<ChatArtifact[]>(conversation?.artifacts ?? []);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [compare, setCompare] = useState(false);
  const [comparing, setComparing] = useState<{ messages: ChatMessage[]; models: string[]; body: Record<string, unknown> } | null>(null);
  const [panel, setPanel] = useState<{ id?: string; callId?: string; index?: number } | null>(null);
  const [seenDraft, setSeenDraft] = useState<string | null>(null);

  // The latest of what is saved, for onFinish (which may run after the conversation was closed)
  const latest = useRef({ tree, edits, temporary });
  useEffect(() => {
    latest.current = { tree, edits, temporary };
  }, [tree, edits, temporary]);
  const save = (messages: ChatUIMessage[], touched: boolean, force = false) => {
    const { tree: t, edits: e, temporary: temp } = latest.current;
    if (!idRef.current || (temp && !force)) return;
    const path = stored(messages);
    const synced = syncTree(t, path);
    const artifacts = withToolCalls(e, path);
    onSave(idRef.current, { messages: path, tree: hasBranches(synced) ? synced : undefined, artifacts: artifacts.length ? artifacts : undefined }, touched);
  };

  const { messages, status, error, sendMessage, regenerate, stop, setMessages } = useChat<ChatUIMessage>({
    messages: (conversation?.messages ?? []) as ChatUIMessage[],
    transport,
    throttle: 40,
    onFinish: ({ message, messages: all, isAbort }) => {
      // Stopped by the person: say so under what did arrive
      const final = isAbort ? all.map((m) => (m.id === message.id && m.role === "assistant" ? { ...m, metadata: { ...m.metadata, stopped: true } } : m)) : all;
      if (isAbort) setMessages(final);
      save(final, false);
    },
    onError: (e) => {
      if (chatErrorOf(e).code === "no-key") onMissingKey();
    },
  });
  const path = messages as ChatMessage[];
  const synced = useMemo(() => syncTree(tree, path), [tree, path]);
  const artifacts = useMemo(() => withToolCalls(edits, path), [edits, path]);

  // Save whenever nothing is streaming; a request going out moves it to the top. Not what it
  // opened with: writing that back could overwrite a newer copy in storage.
  const opened = useRef({ messages, tree, edits });
  const persist = useEffectEvent((all: ChatUIMessage[], touched: boolean) => save(all, touched));
  useEffect(() => {
    const o = opened.current;
    if ((messages !== o.messages || tree !== o.tree || edits !== o.edits) && status !== "streaming") persist(messages, status === "submitted");
  }, [messages, status, tree, edits]);

  const model = conversation && isChatModel(conversation.model) ? conversation.model : prefs.model;
  const info = chatModel(model);
  const second = prefs.compareWith && isChatModel(prefs.compareWith) && prefs.compareWith !== model ? prefs.compareWith : CHAT_MODELS.find((m) => m.id !== model)!.id;
  const body = () => ({ model, think: prefs.think, documents: wireDocuments(artifacts) });
  const busy = status === "submitted" || status === "streaming";
  const locked = busy || !!comparing;
  const keepFiles = !temporary;

  const focusBox = () => requestAnimationFrame(() => root.current?.querySelector<HTMLTextAreaElement>("[data-slot=chat-composer] textarea")?.focus());
  useImperativeHandle(
    handle,
    () => ({
      insert: (text) => {
        setDraft(text);
        focusBox();
      },
      focus: focusBox,
      lastAnswer: () => {
        const a = messages.findLast((m) => m.role === "assistant");
        return a ? messageText(a as ChatMessage) || null : null;
      },
    }),
    [messages],
  );

  const begin = (text: string, attachments: ChatAttachment[]) => {
    if (!idRef.current && !temporary) idRef.current = onCreate(text || attachments[0]?.name || "Files");
  };
  const ask = (text: string, attachments: ChatAttachment[] = []) => {
    begin(text, attachments);
    const { files: parts, sizes } = fileParts(attachments, keepFiles);
    const metadata = sizes ? { sizes } : undefined;
    void sendMessage(parts.length ? (text ? { text, files: parts, metadata } : { files: parts, metadata }) : { text }, { body: body() });
  };

  const startCompare = (text: string, attachments: ChatAttachment[]) => {
    begin(text, attachments);
    const { files: parts, sizes } = fileParts(attachments, keepFiles);
    const question: ChatUIMessage = {
      id: generateId(),
      role: "user",
      parts: [...parts, ...(text ? [{ type: "text" as const, text }] : [])],
      metadata: sizes ? { sizes } : undefined,
    };
    const next = [...messages, question];
    setMessages(next);
    setComparing({ messages: next as ChatMessage[], models: [model, second], body: { think: prefs.think, documents: wireDocuments(artifacts) } });
  };

  const send = (text: string, attachments: ChatAttachment[]) => {
    if (compare) startCompare(text, attachments);
    else ask(text, attachments);
    setDraft("");
    setFiles([]);
  };

  const pickCompared = (kept: ChatMessage, all: ChatMessage[]) => {
    if (!comparing) return;
    const before = stored(comparing.messages, { keepFiles });
    const question = before.at(-1)!;
    const answers = stored(all, { keepFiles });
    const keptStored = answers.find((a) => a.id === kept.id)!;
    const full = [...before, keptStored];
    // The answers in column order under the question, then the kept one on the path
    setTree(syncTree(addSiblings(syncTree(tree, before), before, question.id, answers), full));
    setMessages(full as ChatUIMessage[]);
    setComparing(null);
  };

  const retry = () => void regenerate({ body: body() });
  const regenerateAt = (messageId: string) => {
    const at = messages.findIndex((m) => m.id === messageId);
    if (at < 0) return;
    setTree(stashFrom(synced, stored(messages, { keepFiles }), at));
    void regenerate({ messageId, body: body() });
  };
  const edit = (messageId: string, text: string, attachments: ChatAttachment[]) => {
    const at = messages.findIndex((m) => m.id === messageId);
    if (at < 0) return;
    setTree(stashFrom(synced, stored(messages, { keepFiles }), at));
    setMessages(messages.slice(0, at));
    const { files: parts, sizes } = fileParts(attachments, keepFiles);
    const metadata = { edited: true, ...(sizes ? { sizes } : {}) };
    void sendMessage(parts.length ? (text ? { text, files: parts, metadata } : { files: parts, metadata }) : { text, metadata }, { body: body() });
  };
  const branchAt = (i: number): ChatMessageBranch | undefined => {
    const { ids, index } = versionsAt(synced, path, i);
    if (ids.length < 2) return undefined;
    return {
      index,
      count: ids.length,
      onChange: (step) => {
        const to = ids[index + step];
        if (!to) return;
        const next = switchVersion(synced, stored(messages, { keepFiles }), i, to);
        setTree(next.tree);
        setMessages(next.path as ChatUIMessage[]);
      },
    };
  };
  const feedback = (id: string, f: "up" | "down" | undefined) => {
    setMessages(messages.map((m) => (m.id === id ? { ...m, metadata: { ...m.metadata, feedback: f } } : m)));
    if (f) toast({ title: "Thanks for the feedback", description: f === "up" ? "Marked as a good answer." : "Marked as a bad answer.", duration: 2500 });
  };

  // Documents being written right now, in the answer coming in
  const last = path.at(-1);
  const drafts =
    status === "streaming" && last?.role === "assistant"
      ? last.parts.flatMap((p) => {
          const d = isToolPart(p) ? draftOf(p, artifacts) : null;
          return d ? [d] : [];
        })
      : [];
  const live = drafts.at(-1) ?? null;
  // A document being written or rewritten opens beside the chat, once per call
  if (live && live.callId !== seenDraft) {
    setSeenDraft(live.callId);
    if (live.tool === "createDocument" || live.tool === "updateDocument") setPanel({ callId: live.callId, id: live.id });
  }
  const callPart = (callId?: string) => (callId ? (path.flatMap((m) => m.parts).find((p) => p.toolCallId === callId) ?? null) : null);
  const panelId = panel ? (panel.id ?? documentOf(callPart(panel.callId))) : undefined;
  const panelArtifact = panelId ? (artifacts.find((a) => a.id === panelId) ?? null) : null;
  const panelDraft = panel ? (drafts.find((d) => d.callId === panel.callId || (!!panelId && d.id === panelId)) ?? null) : null;
  const panelOpen = !!panel && (!!panelArtifact || !!panelDraft);

  // What the model will make of the files
  const pictures = files.some((f) => f.mediaType.startsWith("image/"));
  const pdfs = files.some((f) => f.mediaType === "application/pdf");
  const attachmentNote =
    pictures && info && !info.reads.images
      ? `${info.name} can't see pictures: pick another model to send them.`
      : pdfs && info && !info.reads.pdfs
        ? `${info.name} can't read PDFs itself, so their text is taken out for it (no pictures or layout).`
        : null;

  const keep = () => {
    idRef.current = onCreate(messageText(path.find((m) => m.role === "user") ?? { id: "", role: "user", parts: [] }) || "Kept chat");
    onKeep();
    latest.current = { ...latest.current, temporary: false };
    save(messages, true, true);
  };

  return (
    <div ref={root} className="relative flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {temporary && (
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted px-3 py-1.5 text-[13px] sm:px-4">
            <Icon icon={MessageSquareDashed} size={16} className="shrink-0 text-muted-foreground" />
            <p className="flex-1">Temporary chat: not saved, not listed, and gone when you leave it.</p>
            {messages.length > 0 && !busy && (
              <Button size="sm" variant="ghost" onClick={keep}>
                Keep it
              </Button>
            )}
          </div>
        )}
        <ChatThread
          className="flex-1"
          messages={path}
          status={status}
          error={error ? chatErrorOf(error) : null}
          onRetry={missingKey || comparing ? undefined : retry}
          onRegenerate={missingKey || comparing ? undefined : regenerateAt}
          onEdit={missingKey || comparing ? undefined : edit}
          branchAt={comparing ? undefined : branchAt}
          onFeedback={feedback}
          artifacts={artifacts}
          onOpenArtifact={({ id, callId, version }) => {
            const doc = id ? artifacts.find((a) => a.id === id) : undefined;
            setPanel({ id, callId, index: doc && version && version < doc.versions.length ? version - 1 : undefined });
          }}
          activeArtifact={panelOpen ? { id: panelId, callId: panel?.callId } : null}
          pendingModel={model}
          suggestions={CHAT_SUGGESTIONS}
          onSuggestion={missingKey ? undefined : (prompt) => send(prompt, [])}
          intro={
            temporary
              ? "Nothing in a temporary chat is kept: not the messages, not the files."
              : saved
                ? "Ask anything, attach a picture, a PDF or a text file, or start from one of these. Conversations are kept in this browser only."
                : undefined
          }
          footer={
            comparing && (
              <ChatCompareView
                messages={comparing.messages}
                models={comparing.models}
                transport={transport}
                body={comparing.body}
                onPick={pickCompared}
                onCancel={() => setComparing(null)}
              />
            )
          }
        />
        {/* No rule above the composer: the sidebar has none at that height to meet it */}
        <div className="shrink-0 px-3 pt-1 pb-3 sm:px-4">
          <div className="mx-auto max-w-3xl">
            {missingKey ? (
              <Alert variant="warning" icon={Key} title="This chat needs an API key">
                Set <code className="font-mono text-[13px]">OPENROUTER_API_KEY</code> on the server to send messages. Conversations already in this
                browser can still be read.
              </Alert>
            ) : (
              <ChatComposer
                value={draft}
                onValueChange={setDraft}
                onSend={send}
                streaming={busy}
                disabled={!!comparing}
                onStop={() => void stop()}
                placeholder={comparing ? "Pick an answer above to go on" : compare ? `Ask ${chatModelName(model)} and ${chatModelName(second)}` : `Message ${chatModelName(model)}`}
                autoFocus={autoFocus}
                attach
                attachments={files}
                onAttachmentsChange={setFiles}
                attachmentNote={attachmentNote}
                slash={slash}
                onSlash={(item) => {
                  if (item.group === "Prompts") onPrompt(item.key);
                  else if (item.command === "compare") setCompare((c) => !c);
                  else onAction(item.command as ChatAction);
                }}
                voice
                tools={
                  <>
                    <ChatModelPicker value={model} onChange={(id) => onPrefsChange({ model: id })} needs={{ images: pictures }} showPrice={!compare} />
                    <Toggle
                      variant="ghost"
                      icon={Brain}
                      pressed={prefs.think}
                      onPressedChange={(think) => onPrefsChange({ think })}
                      title="Let the model think before it answers: slower and dearer, often better. Its reasoning shows above the answer."
                    >
                      {/* Only the icon on a phone, so the tools fit */}
                      <span className="max-sm:sr-only">Thinking</span>
                    </Toggle>
                    <Toggle
                      variant="ghost"
                      icon={Columns2}
                      pressed={compare}
                      onPressedChange={setCompare}
                      title="Ask two models at once, side by side, and keep the better answer"
                    >
                      <span className="max-sm:sr-only">Compare</span>
                    </Toggle>
                    {compare && (
                      <ChatModelPicker label="Second model" value={second} onChange={(id) => onPrefsChange({ compareWith: id })} models={CHAT_MODELS.filter((m) => m.id !== model)} showPrice={false} needs={{ images: pictures }} />
                    )}
                  </>
                }
              />
            )}
          </div>
        </div>
      </div>
      {panelOpen && (
        <ChatArtifactPanel
          artifact={panelArtifact}
          draft={panelDraft}
          index={panel?.index}
          onIndexChange={(index) => setPanel((p) => p && { ...p, index })}
          onChange={(next) => setEdits(artifacts.map((a) => (a.id === next.id ? next : a)))}
          onAsk={missingKey ? undefined : (prompt) => ask(prompt)}
          busy={locked}
          onClose={() => setPanel(null)}
          className="max-lg:absolute max-lg:inset-0 max-lg:z-20 lg:w-[min(48%,46rem)] lg:shrink-0 lg:border-l lg:border-border"
        />
      )}
    </div>
  );
}

/** A conversation someone shared in a link: read-only, with "Save a copy" */
function SharedSession({ shared }: { shared: SharedConversation }) {
  const [open, setOpen] = useState<string | null>(null);
  const artifact = shared.artifacts?.find((a) => a.id === open) ?? null;
  return (
    <div className="relative flex min-h-0 flex-1">
      <ChatThread
        className="min-w-0 flex-1"
        messages={shared.messages}
        artifacts={shared.artifacts}
        onOpenArtifact={({ id }) => id && setOpen(id)}
        activeArtifact={artifact ? { id: artifact.id } : null}
      />
      {artifact && (
        <ChatArtifactPanel
          artifact={artifact}
          onClose={() => setOpen(null)}
          className="max-lg:absolute max-lg:inset-0 max-lg:z-20 lg:w-[min(48%,46rem)] lg:shrink-0 lg:border-l lg:border-border"
        />
      )}
    </div>
  );
}

const subscribeNever = () => () => {};

// The address's #fragment, which can hold a shared conversation
const hashListeners = new Set<() => void>();
const subscribeHash = (l: () => void) => {
  hashListeners.add(l);
  window.addEventListener("hashchange", l);
  return () => {
    hashListeners.delete(l);
    window.removeEventListener("hashchange", l);
  };
};
const clearHash = () => {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  hashListeners.forEach((l) => l());
};

export interface ChatAppProps {
  /** Where the chat route is. Default /api/chat. */
  api?: string;
  /** Talk to something other than the route (stories use a fake). Read once, on mount. */
  transport?: ChatTransport<ChatUIMessage>;
  /** Remember conversations, choices and saved prompts in localStorage under this key; leave out to keep them in memory only */
  storageKey?: string;
  /** The conversations before anything is remembered */
  defaultConversations?: ChatConversation[];
  /**
   * Conversations that are always in the list, even once there are conversations of your own
   * (added to what was remembered before they existed). Sending in one keeps it like your own;
   * deleting one hides it for good (remembered with `storageKey`).
   */
  showcase?: ChatConversation[];
  /** The day the `demo` conversations were written for: the sidebar files them as if it were today */
  demoToday?: ISODate;
  /** The conversation open first; null (default) for a new chat */
  defaultOpenId?: string | null;
  /** The model for new chats until one is picked */
  defaultModel?: string;
  /** Thinking on until it is switched off (it is remembered with `storageKey`). Default on. */
  defaultThinking?: boolean;
  /** The saved prompts until they are changed. Default: a few to start with. */
  defaultPrompts?: ChatPrompt[];
  /** The server has no OPENROUTER_API_KEY: a notice takes the composer's place */
  missingKey?: boolean;
  /** More controls in the top bar: a theme switch */
  actions?: ReactNode;
  /** The date the sidebar groups by. Default: the viewer's today. */
  today?: ISODate;
  /** The name in the bar */
  brand?: ReactNode;
  /** The frame: full window height by default */
  className?: string;
}

/**
 * A working chat with language models. Conversations are in the sidebar, pinned ones first, then
 * newest first under Today, Yesterday and so on (a drawer on phones), with New chat and a search
 * above them and the prompt library, import and the shortcuts below. The open one can be pinned,
 * shared as a link, exported (Markdown or JSON), renamed or deleted from its ⋯ menu; a new chat can
 * be made temporary, kept nowhere.
 *
 * Answers stream in as Markdown from the model picked under the box, with the reasoning folded
 * above (Thinking, on by default, asks for it). Questions can carry pictures, PDFs and text files
 * (attached, dropped or pasted). The model can write documents (text, code, a sheet) that open in a
 * panel beside the chat, with versions, changes, suggestions and Run for code, and look up the
 * weather. Any answer can be regenerated and any question edited, each keeping the old version
 * (‹ 1/2 ›); Compare asks two models at once and keeps the answer picked. Answers get thumbs, Read
 * aloud and what they cost. / in the box lists actions and saved prompts. Failures (no credit,
 * rate limits, the network, a refusal) show in the conversation with Retry.
 *
 * It talks to the chat-route item at `api` through the AI SDK's useChat. With `storageKey`
 * conversations stay in this browser (files in IndexedDB); nothing is kept on the server. Without
 * the server's key, pass `missingKey` and the composer is replaced by a notice. Put a <Toaster />
 * on the page for its notices.
 */
export function ChatApp({
  api = "/api/chat",
  transport: ownTransport,
  storageKey,
  defaultConversations = [],
  showcase = [],
  demoToday,
  defaultOpenId = null,
  defaultModel = DEFAULT_CHAT_MODEL,
  defaultThinking = true,
  defaultPrompts = CHAT_PROMPTS,
  missingKey = false,
  actions,
  today: fixedToday,
  brand = "Parley",
  className,
}: ChatAppProps) {
  const [kept, setKept] = useStoredState<ChatConversation[]>(storageKey && `${storageKey}:conversations`, defaultConversations);
  const [prefs, setPrefs] = useStoredState<Prefs>(storageKey && `${storageKey}:prefs`, { model: defaultModel, think: defaultThinking });
  const [prompts, setPrompts] = useStoredState<ChatPrompt[]>(storageKey && `${storageKey}:prompts`, defaultPrompts);
  // The showcase joins whatever was remembered, unless it was deleted; every change is made to
  // (and saved as) the joined list, so a showcase conversation that is sent in stays
  const withShowcase = (cs: ChatConversation[]) => [...cs, ...showcase.filter((s) => !cs.some((c) => c.id === s.id) && !prefs.hidden?.includes(s.id))];
  const conversations = withShowcase(kept);
  const setConversations = (change: (cs: ChatConversation[]) => ChatConversation[]) => setKept((cs) => change(withShowcase(cs)));
  // The session key outlives a new chat getting its id, so the first answer isn't cut off
  const [view, setView] = useState({ openId: defaultOpenId, session: defaultOpenId ?? "new", focus: false, temporary: false });
  const [noKey, setNoKey] = useState(false);
  const [dialog, setDialog] = useState<null | "rename" | "delete" | "share" | "prompts" | "shortcuts">(null);
  const [filling, setFilling] = useState<ChatPrompt | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [transport] = useState(() => ownTransport ?? chatTransport(api));
  const session = useRef<ChatSessionHandle>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const importer = useRef<HTMLInputElement>(null);
  const viewerToday = useToday();
  // False on the server and while hydrating, when the remembered conversations aren't read yet
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const today = fixedToday ?? viewerToday;

  // A shared conversation in the address opens read-only
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const shareText = shareInHash(hash);
  const [shared, setShared] = useState<{ text: string; conversation: SharedConversation | null } | null>(null);
  useEffect(() => {
    if (!shareText) return;
    let live = true;
    void decodeShare(shareText).then((conversation) => live && setShared({ text: shareText, conversation }));
    return () => {
      live = false;
    };
  }, [shareText]);
  const sharing = shareText ? (shared?.text === shareText ? shared : { text: shareText, conversation: undefined }) : null;

  const open = conversations.find((c) => c.id === view.openId) ?? null;
  const safePrefs = { ...prefs, model: isChatModel(prefs.model) ? prefs.model : DEFAULT_CHAT_MODEL };

  const newChat = (temporary = false) => {
    if (sharing) clearHash();
    setView({ openId: null, session: `new-${generateId()}`, focus: true, temporary });
  };
  const openChat = (id: string) => {
    if (sharing) clearHash();
    if (id !== view.openId) setView({ openId: id, session: id, focus: false, temporary: false });
  };
  const update = (id: string, change: (c: ChatConversation) => ChatConversation) => setConversations((cs) => cs.map((c) => (c.id === id ? change(c) : c)));

  const onCreate = (text: string) => {
    const id = generateId();
    const now = Date.now();
    setConversations((cs) => [{ id, title: titleFrom(text), model: safePrefs.model, createdAt: now, updatedAt: now, messages: [] }, ...cs]);
    setView((v) => ({ ...v, openId: id }));
    return id;
  };
  // A demo conversation sent in becomes an ordinary one, dated now
  const onSave = (id: string, patch: Pick<ChatConversation, "messages" | "tree" | "artifacts">, touched: boolean) =>
    update(id, (c) => (touched ? { ...c, ...patch, updatedAt: Date.now(), demo: undefined } : { ...c, ...patch }));
  const onPrefsChange = (p: Partial<Prefs>) => {
    setPrefs((old) => ({ ...old, ...p }));
    if (p.model && open) update(open.id, (c) => ({ ...c, model: p.model! }));
  };

  const applyPrompt = (p: ChatPrompt) => {
    setDialog(null);
    if (promptBlanks(p.text).length) setFilling(p);
    else session.current?.insert(p.text);
  };
  const exportMarkdown = () => {
    if (!open) return void toast({ title: "Nothing to export yet", description: "Send a message first." });
    downloadText(conversationMarkdown(open), exportFileName(open.title, "md"), "text/markdown");
  };
  const exportJson = async () => {
    if (!open) return;
    downloadText(await conversationJson(open, sendableUrl), exportFileName(open.title, "json"), "application/json");
  };
  const importFile = async (file: File) => {
    try {
      if (file.size > 40 * 1024 * 1024) throw new Error("The file is bigger than 40 MB.");
      const c = parseImport(await file.text(), (id) => conversations.some((x) => x.id === id), generateId);
      const keepFiles = (m: ChatMessage): ChatMessage => ({ ...m, parts: m.parts.map((p) => (p.type === "file" && p.url ? { ...p, url: storedUrl(p.url) } : p)) });
      const imported: ChatConversation = {
        ...c,
        messages: c.messages.map(keepFiles),
        tree: c.tree && { ...c.tree, stash: Object.fromEntries(Object.entries(c.tree.stash).map(([k, m]) => [k, keepFiles(m)])) },
      };
      setConversations((cs) => [imported, ...cs]);
      openChat(imported.id);
      toast({ title: `Imported “${imported.title}”`, variant: "success" });
    } catch (e) {
      toast({ title: "Couldn't import that file", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };
  const onAction = (action: ChatAction) => {
    if (action === "new") newChat();
    else if (action === "temporary") newChat(true);
    else if (action === "prompts") setDialog("prompts");
    else if (action === "shortcuts") setDialog("shortcuts");
    else if (action === "export") exportMarkdown();
    else if (action === "share") {
      if (open) setDialog("share");
      else toast({ title: "Nothing to share yet", description: view.temporary ? "A temporary chat can't be shared." : "Send a message first." });
    }
  };
  const startSearch = () => {
    // The box takes focus as it appears (autoFocus); if it is already there, now
    setSearching(true);
    searchBox.current?.focus();
  };
  const endSearch = () => {
    setSearching(false);
    setQuery("");
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || document.querySelector("dialog[open]")) return;
    if (isShortcut(e, ["mod", "Shift", "O"])) {
      e.preventDefault();
      newChat();
    } else if (isShortcut(e, ["mod", "K"])) {
      e.preventDefault();
      startSearch();
    } else if (isShortcut(e, ["Shift", "Esc"])) {
      e.preventDefault();
      session.current?.focus();
    } else if (isShortcut(e, ["mod", "Shift", "C"])) {
      const text = session.current?.lastAnswer();
      if (!text) return;
      e.preventDefault();
      void navigator.clipboard.writeText(text).then(
        () => toast({ title: "Copied the last answer", duration: 2500 }),
        () => toast({ title: "Couldn't copy", variant: "destructive" }),
      );
    } else if (isShortcut(e, ["mod", "/"])) {
      e.preventDefault();
      setDialog("shortcuts");
    }
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const slash: ChatSlashItem[] = [
    ...ACTIONS,
    ...prompts.map((p) => ({ key: p.id, command: p.command, title: p.title, description: p.text.replace(/\s+/g, " ").slice(0, 70), group: "Prompts" as const })),
  ];

  const q = query.trim();
  const pinned = conversations.filter((c) => c.pinned);
  const sections: SidebarSection[] = q
    ? (() => {
        const found = conversations.filter((c) => conversationMatches(c, q));
        return [{ key: "results", heading: "Results", items: found.length ? found.map((c) => ({ key: c.id, label: c.title, href: `#${c.id}` })) : [{ key: "none", label: "No matches" }] }];
      })()
    : [
        ...(pinned.length ? [{ key: "pinned", heading: "Pinned", items: pinned.map((c) => ({ key: c.id, label: c.title, href: `#${c.id}`, icon: Pin })) }] : []),
        ...(pinned.length === conversations.length && pinned.length ? [] : chatSections(conversations.filter((c) => !c.pinned), today, demoToday)),
      ];

  const sharedConversation = sharing?.conversation;
  const title = sharing ? (sharedConversation?.title ?? "Shared conversation") : view.temporary ? "Temporary chat" : (open?.title ?? "New chat");

  return (
    <AppShell
      brand={brand}
      sections={sections}
      sidebarLabel="Conversations"
      current={sharing ? undefined : (view.openId ?? undefined)}
      onNavigate={(key) => key !== "none" && openChat(key)}
      storageKey={storageKey && `${storageKey}:layout`}
      // The sidebar's top box is 8px of padding round a 28px control, 45px with its border, as the
      // conversation's header is; the rail's has 6px, so its button gets 2px more each side
      sidebarHeader={(rail) =>
        rail ? (
          <div className="py-0.5">
            <IconButton variant="primary" icon={SquarePen} label="New chat" onClick={() => newChat()} />
          </div>
        ) : searching ? (
          <div className="flex gap-1">
            <Input
              ref={searchBox}
              autoFocus
              type="search"
              aria-label="Search conversations"
              placeholder="Search conversations"
              prefix={<Icon icon={Search} size={14} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), endSearch())}
              className="min-w-0 flex-1"
            />
            <IconButton variant="ghost" icon={X} label="Close search" onClick={endSearch} />
          </div>
        ) : (
          <div className="flex gap-1">
            <Button variant="primary" icon={SquarePen} onClick={() => newChat()} className="flex-1">
              New chat
            </Button>
            <IconButton variant="ghost" icon={Search} label="Search conversations" onClick={startSearch} />
          </div>
        )
      }
      sidebarFooter={(rail) =>
        rail ? (
          <div className="flex flex-col items-center gap-1">
            <IconButton variant="ghost" icon={BookText} label="Prompt library" onClick={() => setDialog("prompts")} />
            <IconButton variant="ghost" icon={Upload} label="Import a conversation" onClick={() => importer.current?.click()} />
            <IconButton variant="ghost" icon={Keyboard} label="Keyboard shortcuts" onClick={() => setDialog("shortcuts")} />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="ghost" icon={BookText} onClick={() => setDialog("prompts")} className="mr-auto">
              Prompts
            </Button>
            <IconButton variant="ghost" icon={Upload} label="Import a conversation (JSON)" onClick={() => importer.current?.click()} />
            <IconButton variant="ghost" icon={Keyboard} label="Keyboard shortcuts" onClick={() => setDialog("shortcuts")} />
          </div>
        )
      }
      actions={
        <>
          <IconButton variant="ghost" icon={SquarePen} label="New chat" onClick={() => newChat()} className="md:hidden" />
          {actions}
        </>
      }
      className={cn("h-dvh", className)}
      mainClassName="flex flex-col overflow-hidden"
    >
      <input
        ref={importer}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void importFile(file);
        }}
      />
      {/* Level with the sidebar's New chat box: 8px, a 28px row (the menu button's height), 8px, the border */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <h1 className="flex h-ctl-md min-w-0 flex-1 items-center text-[15px] font-bold">
          {open?.pinned && !sharing && <Icon icon={Pin} size={14} className="mr-1.5 shrink-0 text-muted-foreground" label="Pinned" />}
          <span className="truncate">{title}</span>
        </h1>
        {sharing ? (
          <>
            {sharedConversation && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const now = Date.now();
                  const id = generateId();
                  const copy: ChatConversation = {
                    id,
                    title: sharedConversation.title,
                    model: isChatModel(sharedConversation.model) ? sharedConversation.model : DEFAULT_CHAT_MODEL,
                    createdAt: now,
                    updatedAt: now,
                    messages: sharedConversation.messages,
                    artifacts: sharedConversation.artifacts,
                  };
                  setConversations((cs) => [copy, ...cs]);
                  openChat(id);
                  toast({ title: "Saved a copy", description: "It's in your conversations now.", variant: "success" });
                }}
              >
                Save a copy
              </Button>
            )}
            <IconButton variant="ghost" icon={X} label="Close the shared conversation" onClick={clearHash} />
          </>
        ) : open ? (
          <DropdownMenu
            trigger={Ellipsis}
            label="Conversation actions"
            triggerVariant="ghost"
            align="end"
            items={[
              open.pinned
                ? { label: "Unpin", icon: PinOff, onSelect: () => update(open.id, (c) => ({ ...c, pinned: undefined })) }
                : { label: "Pin", icon: Pin, onSelect: () => update(open.id, (c) => ({ ...c, pinned: true })) },
              { label: "Share a link…", icon: Share2, onSelect: () => setDialog("share") },
              { type: "separator" },
              { label: "Export as Markdown", icon: FileDown, onSelect: exportMarkdown },
              { label: "Export as JSON", icon: Braces, onSelect: () => void exportJson() },
              { type: "separator" },
              { label: "Rename…", icon: Pencil, onSelect: () => setDialog("rename") },
              { label: "Delete…", icon: Trash, destructive: true, onSelect: () => setDialog("delete") },
            ]}
          />
        ) : (
          <Toggle
            variant="ghost"
            icon={MessageSquareDashed}
            pressed={view.temporary}
            onPressedChange={(temporary) => setView({ openId: null, session: `new-${generateId()}`, focus: true, temporary })}
            title="A temporary chat isn't saved or listed"
          >
            <span className="max-sm:sr-only">Temporary</span>
          </Toggle>
        )}
      </header>
      {sharing ? (
        sharedConversation ? (
          <SharedSession key={sharing.text} shared={sharedConversation} />
        ) : (
          <div className="mx-auto w-full max-w-3xl p-6">
            {sharedConversation === null ? (
              <Alert
                variant="destructive"
                title="This link can't be opened"
                actions={
                  <Button size="sm" onClick={clearHash}>
                    Close
                  </Button>
                }
              >
                It may have been cut short when it was copied. Ask for the link again.
              </Alert>
            ) : (
              <Spinner className="text-muted-foreground">Opening the shared conversation…</Spinner>
            )}
          </div>
        )
      ) : (
        <ChatSession
          // Started again once storage is read, so it opens with the saved messages, not the defaults
          key={`${view.session}${hydrated ? "" : ":ssr"}`}
          handle={session}
          conversation={open}
          prefs={safePrefs}
          onPrefsChange={onPrefsChange}
          transport={transport}
          missingKey={missingKey || noKey}
          onMissingKey={() => setNoKey(true)}
          onCreate={onCreate}
          onSave={onSave}
          autoFocus={view.focus}
          saved={!!storageKey}
          temporary={view.temporary}
          onKeep={() => setView((v) => ({ ...v, temporary: false }))}
          slash={slash}
          onAction={onAction}
          onPrompt={(id) => {
            const p = prompts.find((x) => x.id === id);
            if (p) applyPrompt(p);
          }}
        />
      )}
      <ChatRenameDialog
        open={dialog === "rename" && open != null}
        title={open?.title ?? ""}
        onClose={() => setDialog(null)}
        onRename={(t) => open && update(open.id, (c) => ({ ...c, title: t }))}
      />
      <ChatDeleteDialog
        open={dialog === "delete" && open != null}
        title={open?.title ?? ""}
        onClose={() => setDialog(null)}
        onDelete={() => {
          if (!open) return;
          if (showcase.some((c) => c.id === open.id)) setPrefs((p) => ({ ...p, hidden: [...(p.hidden ?? []), open.id] }));
          else forgetAttachments([...open.messages, ...Object.values(open.tree?.stash ?? {})].flatMap((m) => m.parts.flatMap((p) => (p.type === "file" && p.url ? [p.url] : []))));
          setConversations((cs) => cs.filter((c) => c.id !== open.id));
          newChat();
        }}
      />
      <ChatShareDialog open={dialog === "share" && open != null} onClose={() => setDialog(null)} conversation={open} />
      <ChatPromptLibrary
        open={dialog === "prompts"}
        onClose={() => setDialog(null)}
        prompts={prompts}
        onChange={setPrompts}
        onUse={sharing ? undefined : applyPrompt}
        reserved={ACTIONS.map((a) => a.command)}
      />
      <ChatPromptFill
        prompt={filling}
        onClose={() => setFilling(null)}
        onUse={(text) => {
          setFilling(null);
          session.current?.insert(text);
        }}
      />
      <ChatShortcutsDialog open={dialog === "shortcuts"} onClose={() => setDialog(null)} />
    </AppShell>
  );
}
