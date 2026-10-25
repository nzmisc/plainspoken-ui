"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, generateId, type ChatTransport, type UIMessage } from "ai";
import { Brain, Ellipsis, Key, Pencil, SquarePen, Trash } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { useStoredState } from "@/registry/plainspoken/hooks/use-stored-state";
import { useToday } from "@/registry/plainspoken/hooks/use-today";
import { CHAT_SUGGESTIONS, type ChatConversation, type ChatMessage, type ChatMetadata } from "@/registry/plainspoken/blocks/chat/data";
import { chatErrorOf, titleFrom } from "@/registry/plainspoken/blocks/chat/format";
import { CHAT_LIMITS, DEFAULT_CHAT_MODEL, chatModelName, isChatModel } from "@/registry/plainspoken/blocks/chat/models";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";
import { ChatDeleteDialog, ChatRenameDialog, chatSections } from "@/registry/plainspoken/blocks/chat/conversations";
import { ChatModelPicker } from "@/registry/plainspoken/blocks/chat/model-picker";
import { ChatThread } from "@/registry/plainspoken/blocks/chat/thread";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

/** useChat's messages, with what the route adds to an answer */
export type ChatUIMessage = UIMessage<ChatMetadata>;

/** The text of the last messages, which is all the route takes (it checks again) */
function wire(messages: ChatUIMessage[]) {
  return messages.slice(-CHAT_LIMITS.maxMessages).map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts.flatMap((p) => (p.type === "text" ? [{ type: "text", text: p.text }] : [])),
  }));
}

/** The transport to the chat route: posts the conversation's text, the model and whether to think */
export function chatTransport(api = "/api/chat"): ChatTransport<ChatUIMessage> {
  return new DefaultChatTransport<ChatUIMessage>({
    api,
    prepareSendMessagesRequest: ({ messages, body }) => ({ body: { ...body, messages: wire(messages) } }),
  });
}

/** What is kept in storage: text and reasoning only, marked done */
function stored(messages: ChatUIMessage[]): ChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    metadata: m.metadata,
    parts: m.parts.flatMap((p) => (p.type === "text" || p.type === "reasoning" ? [{ type: p.type, text: p.text, state: "done" }] : [])),
  }));
}

interface Prefs {
  model: string;
  think: boolean;
  /** Showcase conversations that were deleted */
  hidden?: string[];
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
  onSave: (id: string, messages: ChatMessage[], touched: boolean) => void;
  autoFocus: boolean;
  /** Conversations are remembered (in this browser) */
  saved: boolean;
}

/**
 * One conversation, live: useChat with the conversation's messages to start from. A new chat has
 * no conversation until its first message is sent. Messages are saved whenever nothing streams,
 * and once more when an answer finishes, even if the conversation was closed meanwhile.
 */
function ChatSession({ conversation, prefs, onPrefsChange, transport, missingKey, onMissingKey, onCreate, onSave, autoFocus, saved }: SessionProps) {
  const idRef = useRef(conversation?.id ?? null);
  const save = (messages: ChatUIMessage[], touched: boolean) => {
    if (idRef.current) onSave(idRef.current, stored(messages), touched);
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

  // Save what there is whenever nothing is streaming; a request going out moves it to the top.
  // Not what it opened with: writing that back could overwrite a newer copy in storage.
  const opened = useRef(messages);
  const persist = useEffectEvent((all: ChatUIMessage[], touched: boolean) => save(all, touched));
  useEffect(() => {
    if (messages !== opened.current && status !== "streaming") persist(messages, status === "submitted");
  }, [messages, status]);

  const model = conversation && isChatModel(conversation.model) ? conversation.model : prefs.model;
  const body = { model, think: prefs.think };
  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if (!idRef.current) idRef.current = onCreate(text);
    void sendMessage({ text }, { body });
  };
  const retry = () => void regenerate({ body });
  const edit = (messageId: string, text: string) => void sendMessage({ text, messageId, metadata: { edited: true } }, { body });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatThread
        className="flex-1"
        messages={messages}
        status={status}
        error={error ? chatErrorOf(error) : null}
        onRetry={missingKey ? undefined : retry}
        onRegenerate={missingKey ? undefined : retry}
        onEdit={missingKey ? undefined : edit}
        pendingModel={model}
        suggestions={CHAT_SUGGESTIONS}
        onSuggestion={missingKey ? undefined : send}
        intro={saved ? "Ask anything, or start from one of these. Conversations are kept in this browser only." : undefined}
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
              onSend={send}
              streaming={busy}
              onStop={() => void stop()}
              placeholder={`Message ${chatModelName(model)}`}
              autoFocus={autoFocus}
              tools={
                <>
                  <ChatModelPicker value={model} onChange={(id) => onPrefsChange({ model: id })} />
                  <Toggle
                    variant="ghost"
                    icon={Brain}
                    pressed={prefs.think}
                    onPressedChange={(think) => onPrefsChange({ think })}
                    title="Let the model think before it answers: slower and dearer, often better. Its reasoning shows above the answer."
                  >
                    {/* Only the brain on a phone, so the tools fit on one row */}
                    <span className="max-sm:sr-only">Thinking</span>
                  </Toggle>
                </>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

const subscribeNever = () => () => {};

export interface ChatAppProps {
  /** Where the chat route is. Default /api/chat. */
  api?: string;
  /** Talk to something other than the route (stories use a fake). Read once, on mount. */
  transport?: ChatTransport<ChatUIMessage>;
  /** Remember conversations and choices in localStorage under this key; leave out to keep them in memory only */
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
 * A working chat with language models. Conversations are in the sidebar, newest first under
 * Today, Yesterday and so on (a drawer on phones), with New chat above them; the open one can be
 * renamed or deleted from its ⋯ menu. Answers stream in as Markdown from the model picked under
 * the box, with the reasoning folded above when the model shares it (Thinking, on by default,
 * asks for it). Stop ends an answer, the last one can be regenerated, and a question edited and
 * sent again. Failures (no credit, rate limits, the network, a refusal) show in the conversation
 * with Retry. Pre-loaded conversations (`defaultConversations`, `showcase`) can be read and
 * continued like any other.
 *
 * It talks to the chat-route item at `api` through the AI SDK's useChat, sending only the text of
 * the last messages. With `storageKey` the conversations stay in this browser's localStorage;
 * nothing is kept on the server. Without the server's key, pass `missingKey` and the composer is
 * replaced by a notice.
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
  missingKey = false,
  actions,
  today: fixedToday,
  brand = "Parley",
  className,
}: ChatAppProps) {
  const [stored, setStored] = useStoredState<ChatConversation[]>(storageKey && `${storageKey}:conversations`, defaultConversations);
  const [prefs, setPrefs] = useStoredState<Prefs>(storageKey && `${storageKey}:prefs`, { model: defaultModel, think: defaultThinking });
  // The showcase joins whatever was remembered, unless it was deleted; every change is made to
  // (and saved as) the joined list, so a showcase conversation that is sent in stays
  const withShowcase = (cs: ChatConversation[]) => [...cs, ...showcase.filter((s) => !cs.some((c) => c.id === s.id) && !prefs.hidden?.includes(s.id))];
  const conversations = withShowcase(stored);
  const setConversations = (change: (cs: ChatConversation[]) => ChatConversation[]) => setStored((cs) => change(withShowcase(cs)));
  // The session key outlives a new chat getting its id, so the first answer isn't cut off
  const [view, setView] = useState({ openId: defaultOpenId, session: defaultOpenId ?? "new", focus: false });
  const [noKey, setNoKey] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transport] = useState(() => ownTransport ?? chatTransport(api));
  const viewerToday = useToday();
  // False on the server and while hydrating, when the remembered conversations aren't read yet
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const today = fixedToday ?? viewerToday;

  const open = conversations.find((c) => c.id === view.openId) ?? null;
  const safePrefs = { ...prefs, model: isChatModel(prefs.model) ? prefs.model : DEFAULT_CHAT_MODEL };

  const newChat = () => setView({ openId: null, session: `new-${generateId()}`, focus: true });
  const openChat = (id: string) => {
    if (id !== view.openId) setView({ openId: id, session: id, focus: false });
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
  const onSave = (id: string, messages: ChatMessage[], touched: boolean) =>
    update(id, (c) => (touched ? { ...c, messages, updatedAt: Date.now(), demo: undefined } : { ...c, messages }));
  const onPrefsChange = (p: Partial<Prefs>) => {
    setPrefs((old) => ({ ...old, ...p }));
    if (p.model && open) update(open.id, (c) => ({ ...c, model: p.model! }));
  };

  return (
    <AppShell
      brand={brand}
      sections={chatSections(conversations, today, demoToday)}
      sidebarLabel="Conversations"
      current={view.openId ?? undefined}
      onNavigate={openChat}
      storageKey={storageKey && `${storageKey}:layout`}
      // The sidebar's top box is 8px of padding round a 28px control, 45px with its border, as the
      // conversation's header is; the rail's has 6px, so its button gets 2px more each side
      sidebarHeader={(rail) =>
        rail ? (
          <div className="py-0.5">
            <IconButton variant="primary" icon={SquarePen} label="New chat" onClick={newChat} />
          </div>
        ) : (
          <Button variant="primary" icon={SquarePen} block onClick={newChat}>
            New chat
          </Button>
        )
      }
      actions={
        <>
          <IconButton variant="ghost" icon={SquarePen} label="New chat" onClick={newChat} className="md:hidden" />
          {actions}
        </>
      }
      className={cn("h-dvh", className)}
      mainClassName="flex flex-col overflow-hidden"
    >
      {/* Level with the sidebar's New chat box: 8px, a 28px row (the menu button's height), 8px, the border */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <h1 className="flex h-ctl-md min-w-0 flex-1 items-center text-[15px] font-bold">
          <span className="truncate">{open?.title ?? "New chat"}</span>
        </h1>
        {open && (
          <DropdownMenu
            trigger={Ellipsis}
            label="Conversation actions"
            triggerVariant="ghost"
            align="end"
            items={[
              { label: "Rename…", icon: Pencil, onSelect: () => setRenaming(true) },
              { label: "Delete…", icon: Trash, destructive: true, onSelect: () => setDeleting(true) },
            ]}
          />
        )}
      </header>
      <ChatSession
        // Started again once storage is read, so it opens with the saved messages, not the defaults
        key={`${view.session}${hydrated ? "" : ":ssr"}`}
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
      />
      <ChatRenameDialog
        open={renaming && open != null}
        title={open?.title ?? ""}
        onClose={() => setRenaming(false)}
        onRename={(title) => open && update(open.id, (c) => ({ ...c, title }))}
      />
      <ChatDeleteDialog
        open={deleting && open != null}
        title={open?.title ?? ""}
        onClose={() => setDeleting(false)}
        onDelete={() => {
          if (!open) return;
          if (showcase.some((c) => c.id === open.id)) setPrefs((p) => ({ ...p, hidden: [...(p.hidden ?? []), open.id] }));
          setConversations((cs) => cs.filter((c) => c.id !== open.id));
          newChat();
        }}
      />
    </AppShell>
  );
}
