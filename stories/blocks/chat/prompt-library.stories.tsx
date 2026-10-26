import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ChatPromptFill, ChatPromptLibrary, ChatSlashMenu, matchSlash, type ChatSlashItem } from "@/registry/plainspoken/blocks/chat/prompt-library";
import { CHAT_PROMPTS, type ChatPrompt } from "@/registry/plainspoken/blocks/chat/data";
import { Button } from "@/registry/plainspoken/ui/button";

function LibraryDemo() {
  const [open, setOpen] = useState(true);
  const [prompts, setPrompts] = useState(CHAT_PROMPTS);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Prompts</Button>
      <ChatPromptLibrary open={open} onClose={() => setOpen(false)} prompts={prompts} onChange={setPrompts} onUse={(p) => console.log("use", p.command)} reserved={["new", "compare", "share"]} />
    </>
  );
}

const meta: Meta<typeof LibraryDemo> = {
  title: "Blocks/AI chat/Prompt library",
  component: LibraryDemo,
};
export default meta;
type Story = StoryObj<typeof LibraryDemo>;

/**
 * The saved prompts: add, change and delete them, each with a /command. {{blanks}} in the text are
 * filled in before it is sent. A command the chat already uses can't be taken.
 */
export const Library: Story = {};

const withBlanks: ChatPrompt = CHAT_PROMPTS.find((p) => p.text.includes("{{")) ?? CHAT_PROMPTS[0];

/** A prompt with blanks, picked: a small form for each, then Use puts the text in the box. */
export const Fill: Story = {
  render: () => {
    function Demo() {
      const [prompt, setPrompt] = useState<ChatPrompt | null>(withBlanks);
      return (
        <>
          <Button onClick={() => setPrompt(withBlanks)}>/{withBlanks.command}</Button>
          <ChatPromptFill prompt={prompt} onClose={() => setPrompt(null)} onUse={(text) => console.log("use", text)} />
        </>
      );
    }
    return <Demo />;
  },
};

const ITEMS: ChatSlashItem[] = [
  { key: "new", command: "new", title: "New chat", group: "Actions" },
  { key: "compare", command: "compare", title: "Compare two models", description: "The next question goes to two models", group: "Actions" },
  ...CHAT_PROMPTS.map((p): ChatSlashItem => ({ key: p.id, command: p.command, title: p.title, group: "Prompts" })),
];

/** The menu above the box after typing "/": actions, then saved prompts, narrowed as you type. */
export const SlashMenu: Story = {
  render: () => {
    function Demo() {
      const [active, setActive] = useState(0);
      return (
        <div className="relative h-80 max-w-xl">
          <ChatSlashMenu id="slash" items={matchSlash(ITEMS, "")} active={active} onHover={setActive} onPick={(item) => console.log("pick", item.command)} className="absolute bottom-0 inset-x-0" />
        </div>
      );
    }
    return <Demo />;
  },
};
