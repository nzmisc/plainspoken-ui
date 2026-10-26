import { BlogToc } from "@/registry/plainspoken/blocks/blog/toc";

const ITEMS = [
  { id: "the-setup", title: "The setup" },
  { id: "the-runbook", title: "The runbook" },
  { id: "the-gate", title: "The gate", level: 3 as const },
  { id: "what-the-application-saw", title: "What the application saw" },
  { id: "takeaways", title: "Takeaways" },
];

/** The side-column list (it marks the section you are reading as the page scrolls) and the collapsible box for phones. */
export default function BlogTocDemo() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <BlogToc items={ITEMS} />
      <BlogToc items={ITEMS} variant="collapsible" />
    </div>
  );
}
