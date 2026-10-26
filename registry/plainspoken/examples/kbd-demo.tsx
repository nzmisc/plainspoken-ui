import { Kbd } from "@/registry/plainspoken/ui/kbd";

export default function KbdDemo() {
  return (
    <ul className="flex flex-col gap-1.5">
      <li>
        Search everything: <Kbd keys={["⌘", "K"]} /> or <Kbd keys={["Ctrl", "K"]} />
      </li>
      <li>
        Archive the open message: <Kbd>E</Kbd>
      </li>
      <li>
        Move through the list: <Kbd>↑</Kbd> <Kbd>↓</Kbd>, open with <Kbd>Enter</Kbd>, close with <Kbd>Esc</Kbd>
      </li>
      <li>
        Copy as Markdown: <Kbd keys={["Ctrl", "Shift", "C"]} />
      </li>
    </ul>
  );
}
