import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/plainspoken/ui/resizable";

const CODE = `export async function chargeInvoice(id: string) {
  const invoice = await db.invoice.find(id);
  if (invoice.status !== "open") return invoice;
  const charge = await payments.charge(invoice.customer, invoice.total);
  return db.invoice.update(id, { status: "paid", chargeId: charge.id });
}`;

const LOG = `$ npm test -- invoices
 PASS  invoices/charge.test.ts (1.2 s)
  ✓ charges an open invoice (84 ms)
  ✓ leaves a paid invoice alone (3 ms)
  ✓ records the charge id (5 ms)

Tests:       3 passed, 3 total
Time:        1.84 s`;

/** Stacked: an editor over a terminal. Drag the line, or focus it and use ↑ and ↓. */
export default function ResizableVertical() {
  return (
    <div className="h-80 border border-border">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={62} minSize={25}>
          <pre className="p-3 font-mono text-[13px] leading-relaxed">{CODE}</pre>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize terminal" />
        <ResizablePanel defaultSize={38} minSize={15} className="bg-muted">
          <pre className="p-3 font-mono text-[12px] leading-snug">{LOG}</pre>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
