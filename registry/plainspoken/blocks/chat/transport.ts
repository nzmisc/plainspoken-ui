// Between useChat and the chat route: what a request carries (the last messages' text, their files
// read back from the browser within the limits, the tools used as short notes, and the latest
// version of each document), and what is kept of a conversation once an answer is in.
import { DefaultChatTransport, type ChatTransport, type UIMessage } from "ai";
import type { ChatArtifact, ChatMessage, ChatMetadata, ChatPart } from "@/registry/plainspoken/blocks/chat/data";
import { isToolPart } from "@/registry/plainspoken/blocks/chat/format";
import { CHAT_LIMITS } from "@/registry/plainspoken/blocks/chat/models";
import { documentBriefs } from "@/registry/plainspoken/blocks/chat/artifacts";
import { dataUrlBytes, sendableUrl, storedUrl } from "@/registry/plainspoken/blocks/chat/attachments";
import { toolNote } from "@/registry/plainspoken/blocks/chat/export";

/** useChat's messages, with what the route adds to an answer */
export type ChatUIMessage = UIMessage<ChatMetadata>;

type WirePart = { type: "text"; text: string } | { type: "file"; mediaType: string; filename?: string; url: string };

/**
 * The last messages as the route takes them (it checks everything again): text; the files of
 * questions as data: URLs, the newest first within the request's limits, the older ones named in
 * a note instead; and an answer's tool calls as "[Tool: …]" notes, so the model knows what it did.
 */
export async function wire(messages: ChatMessage[]): Promise<{ id: string; role: string; parts: WirePart[] }[]> {
  const recent = messages.slice(-CHAT_LIMITS.maxMessages);
  let count = 0;
  let bytes = 0;
  const out: { id: string; role: string; parts: WirePart[] }[] = [];
  for (let i = recent.length - 1; i >= 0; i--) {
    const m = recent[i];
    const parts: WirePart[] = [];
    for (const p of m.parts) {
      if (p.type === "text" && p.text) parts.push({ type: "text", text: p.text });
      else if (p.type === "file" && p.url && m.role === "user") {
        const name = p.filename ?? "a file";
        const url = await sendableUrl(p.url);
        if (!url) {
          parts.push({ type: "text", text: `\n\n[The file “${name}” was attached, but this browser no longer has it.]` });
          continue;
        }
        const size = dataUrlBytes(url);
        if (count < CHAT_LIMITS.maxFilesPerRequest && bytes + size <= CHAT_LIMITS.maxRequestFileBytes) {
          count++;
          bytes += size;
          parts.push({ type: "file", mediaType: p.mediaType ?? "application/octet-stream", filename: p.filename, url });
        } else parts.push({ type: "text", text: `\n\n[An earlier file, “${name}”, was left out of this request to keep it small.]` });
      } else if (isToolPart(p) && m.role === "assistant" && (p.state === "output-available" || p.state === "output-error")) {
        parts.push({ type: "text", text: `\n\n${toolNote(p)}\n\n` });
      }
    }
    out.unshift({ id: m.id, role: m.role, parts });
  }
  return out;
}

/** The documents a request tells the model about: the latest version of each, within the limits */
export const wireDocuments = (artifacts: ChatArtifact[] | undefined) => documentBriefs(artifacts ?? [], CHAT_LIMITS.maxDocuments, CHAT_LIMITS.maxDocumentChars);

/**
 * The transport to the chat route. Each request posts the conversation (see `wire`) and whatever
 * the call adds to `body`: the model, whether to think, and the documents.
 */
export function chatTransport(api = "/api/chat"): ChatTransport<ChatUIMessage> {
  return new DefaultChatTransport<ChatUIMessage>({
    api,
    prepareSendMessagesRequest: async ({ messages, body }) => ({ body: { ...body, messages: await wire(messages as ChatMessage[]) } }),
  });
}

/**
 * What is kept of the messages: text and reasoning marked done, files by the address they are kept
 * under (`keepFiles` off leaves data: URLs as they are, for a chat that isn't saved), and tool calls
 * with what they were given and gave back. A call cut off before it finished is kept as failed.
 */
export function stored(messages: ChatUIMessage[] | ChatMessage[], { keepFiles = true }: { keepFiles?: boolean } = {}): ChatMessage[] {
  return (messages as ChatMessage[]).map((m) => ({
    id: m.id,
    role: m.role,
    metadata: m.metadata,
    parts: m.parts.flatMap((p): ChatPart[] => {
      if (p.type === "text" || p.type === "reasoning") return [{ type: p.type, text: p.text ?? "", state: "done" }];
      if (p.type === "file" && p.url) return [{ type: "file", mediaType: p.mediaType, filename: p.filename, url: keepFiles ? storedUrl(p.url) : p.url }];
      if (isToolPart(p)) {
        const done = p.state === "output-available" || p.state === "output-error";
        return [
          {
            type: p.type,
            toolCallId: p.toolCallId,
            state: done ? p.state : "output-error",
            input: p.input,
            output: done ? p.output : undefined,
            errorText: done ? p.errorText : "Stopped before it finished.",
          },
        ];
      }
      return [];
    }),
  }));
}
