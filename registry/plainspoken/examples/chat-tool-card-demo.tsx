import { ChatToolCard } from "@/registry/plainspoken/blocks/chat/tool-card";

const input = { port: "Newhaven", date: "2026-10-26" };

/** A tool call in each of its states: being prepared, running, done (open Details), and failed. */
export default function ChatToolCardDemo() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <ChatToolCard name="lookUpTide" title="Tide times" state="input-streaming" />
      <ChatToolCard name="lookUpTide" title="Tide times" state="input-available" input={input} />
      <ChatToolCard name="lookUpTide" title="Tide times" state="output-available" input={input} output={{ high: ["05:41", "18:02"], low: ["11:58"] }} />
      <ChatToolCard name="lookUpTide" title="Tide times" state="output-error" input={input} errorText="The tide service didn't answer in time." />
    </div>
  );
}
