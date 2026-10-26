import { Accordion, AccordionItem } from "@/registry/plainspoken/ui/accordion";

/** exclusive: opening one section closes the others, done by the browser with <details name>. Written as AccordionItem children. */
export default function AccordionExclusive() {
  return (
    <Accordion exclusive className="max-w-xl">
      <AccordionItem title="Shipping address" meta="Berlin" defaultOpen>
        <p>Jonas Weber, Lindenallee 4, 10115 Berlin, Germany</p>
      </AccordionItem>
      <AccordionItem title="Payment" meta="Visa ending 4242">
        <p>Charged when the order ships. Change the card under Settings → Billing.</p>
      </AccordionItem>
      <AccordionItem title="Delivery" meta="2–3 working days">
        <p>DHL, tracked. You get the tracking link by email when the parcel leaves the warehouse.</p>
      </AccordionItem>
    </Accordion>
  );
}
