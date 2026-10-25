import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/plainspoken/ui/resizable";

const FILES = ["app/", "  layout.tsx", "  page.tsx", "lib/", "  invoices.ts", "  payments.ts", "package.json", "README.md"];

/** Groups nest: a file tree beside an editor that sits over a terminal. Each line moves on its own. */
export default function ResizableNested() {
  return (
    <div className="h-96 border border-border">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={25} minSize={15} className="bg-muted">
          <ul className="p-2 font-mono text-[13px] leading-relaxed whitespace-pre">
            {FILES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize file tree" />
        <ResizablePanel defaultSize={75} className="overflow-hidden">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70}>
              <p className="p-3 font-mono text-[13px]">lib/invoices.ts</p>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize terminal" />
            <ResizablePanel defaultSize={30} className="bg-muted">
              <p className="p-3 font-mono text-[12px]">$ npm run dev — ready on http://localhost:3000</p>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
