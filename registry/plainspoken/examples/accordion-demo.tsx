import { Accordion } from "@/registry/plainspoken/ui/accordion";

const FAQ = [
  {
    id: "refund",
    title: "Can I get a refund?",
    content: <p>Yes, within 30 days of paying, for any reason. Write to billing@example.com from the address on the account.</p>,
  },
  {
    id: "seats",
    title: "What happens when I add a seat?",
    meta: "Billing",
    content: <p>You pay for the rest of the month straight away, pro rata, and the full price from the next invoice on.</p>,
  },
  {
    id: "export",
    title: "How do I export my data?",
    meta: "Account",
    content: (
      <p>
        Settings → Data → Export. You get a zip of JSON files by email within an hour. Exports are kept for seven days.
      </p>
    ),
  },
];

export default function AccordionDemo() {
  return <Accordion items={FAQ} defaultOpen={["refund"]} className="max-w-xl" />;
}
