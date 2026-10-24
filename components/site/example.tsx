import { examples } from "@/registry/__examples__";
import { asInstalled, defaultExportDoc, readSource, withoutDefaultExportDoc } from "@/lib/source";
import { CodeBlock } from "@/components/site/code-block";
import { H3, P } from "@/components/site/docs";

/** "button-variants" for the item "button" → "Variants"; "button-demo" → "Overview" */
export function exampleTitle(example: string, item: string): string {
  const rest = example.startsWith(item + "-") ? example.slice(item.length + 1) : example;
  if (rest === "demo" || rest === "") return "Overview";
  const words = rest.replace(/-/g, " ");
  return words[0].toUpperCase() + words.slice(1);
}

/** One example: a heading, the sentence from its doc comment, the live component, and its code (folded). */
export async function Example({ name, item, heading = true }: { name: string; item: string; heading?: boolean }) {
  const Component = examples[name];
  const path = `registry/plainspoken/examples/${name}.tsx`;
  const source = readSource(path);
  const doc = defaultExportDoc(source);
  return (
    <section className="flex flex-col gap-2">
      {heading && <H3 id={name}>{exampleTitle(name, item)}</H3>}
      {doc && <P className="text-muted-foreground">{doc}</P>}
      <div className="border border-border">
        <div className="overflow-x-auto p-4">
          <Component />
        </div>
        <details className="group border-t border-border">
          <summary className="cursor-pointer px-3 py-1 text-[13px] text-muted-foreground select-none hover:text-foreground">Code</summary>
          <CodeBlock code={asInstalled(withoutDefaultExportDoc(source))} title={`${name}.tsx`} className="border-0 border-t" />
        </details>
      </div>
    </section>
  );
}
