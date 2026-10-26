import { CopyButton } from "@/registry/plainspoken/ui/copy-button";

const ROWS = [
  ["Registry", "https://ui.example.com/r/registry.json"],
  ["Install", "npx shadcn add button"],
];

export default function CopyButtonDemo() {
  return (
    <div className="flex flex-col gap-3 text-[14px]">
      <table className="[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5">
        <tbody>
          {ROWS.map(([label, value]) => (
            <tr key={label}>
              <td>{label}</td>
              <td className="font-mono text-[13px]">{value}</td>
              <td className="w-0 !px-0.5">
                <CopyButton text={value} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <CopyButton text="npx shadcn add button" label="Copy command" size="sm" variant="default" />
      </div>
    </div>
  );
}
