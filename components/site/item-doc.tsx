import Link from "next/link";
import { registry, type RegistryEntry } from "@/registry/__index__";
import { REGISTRY_NAMESPACE, registryItemUrl } from "@/lib/site";
import { asInstalled, readSource } from "@/lib/source";
import { storybookDocsFor } from "@/lib/storybook";
import { CodeBlock, Command } from "@/components/site/code-block";
import { A, C, DocsPage, H2, P } from "@/components/site/docs";
import { Example } from "@/components/site/example";

/** The docs page of a component or block */
export function docsHref(entry: RegistryEntry): string {
  return entry.type === "registry:ui" ? `/docs/components/${entry.name}` : `/docs/blocks/${entry.name}`;
}

/** Where the CLI puts a file: its target, or components/ui and lib for the plain kinds */
function installedPath(f: { path: string; type: string; target?: string }): string {
  if (f.target) return f.target;
  const base = f.path.split("/").pop()!;
  if (f.type === "registry:ui") return `components/ui/${base}`;
  if (f.type === "registry:lib") return `lib/${base}`;
  if (f.type === "registry:hook") return `hooks/${base}`;
  return `components/${base}`;
}

/**
 * The docs for one registry item: overview example, install command, what it adds, the other
 * examples, and its source. Shared by component and block pages.
 */
export function ItemDoc({ entry }: { entry: RegistryEntry }) {
  const deps = entry.registryDependencies.filter((d) => d !== "utils" && d !== "foundation" && d !== "icons" && d !== "icon");
  const byName = new Map(registry.map((e) => [e.name, e]));
  return (
    <DocsPage title={entry.title} lead={entry.description} eyebrow={entry.category}>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
        <A href={storybookDocsFor(entry)}>Stories in Storybook</A>
        <A href={`/r/${entry.name}.json`}>Registry item (JSON)</A>
      </p>

      {entry.examples.length > 0 && <Example name={entry.examples[0]} item={entry.name} heading={false} />}

      <H2>Installation</H2>
      <Command>{`npx shadcn@latest add ${registryItemUrl(entry.name)}`}</Command>
      <P>
        Or, with the registry in your <C>components.json</C> (see <A href="/docs/installation">Installation</A>):{" "}
        <C>{`npx shadcn@latest add ${REGISTRY_NAMESPACE}/${entry.name}`}</C>
      </P>
      <P>
        This adds {entry.files.map((f, i) => (
          <span key={f.path}>
            {i > 0 && ", "}
            <C>{installedPath(f)}</C>
          </span>
        ))}
        {deps.length > 0 && (
          <>
            , and what it uses:{" "}
            {deps.map((d, i) => (
              <span key={d}>
                {i > 0 && ", "}
                {byName.get(d) && !byName.get(d)!.hidden ? (
                  <Link className="text-link underline visited:text-link-visited" href={docsHref(byName.get(d)!)}>
                    {byName.get(d)!.title}
                  </Link>
                ) : (
                  d
                )}
              </span>
            ))}
          </>
        )}
        {entry.dependencies.length > 0 && (
          <>
            . npm packages: {entry.dependencies.map((d, i) => (
              <span key={d}>
                {i > 0 && ", "}
                <C>{d}</C>
              </span>
            ))}
          </>
        )}
        . The control height scale and the icons come along the first time.
      </P>

      {entry.examples.length > 1 && (
        <>
          <H2>Examples</H2>
          {entry.examples.slice(1).map((ex) => (
            <Example key={ex} name={ex} item={entry.name} />
          ))}
        </>
      )}

      <H2>Source</H2>
      <P>It is yours once installed: change anything.</P>
      {entry.files
        .filter((f) => /\.(tsx?|css)$/.test(f.path))
        .map((f) => (
          <details key={f.path} className="border border-border">
            <summary className="cursor-pointer px-3 py-1.5 font-mono text-[13px] select-none">{installedPath(f)}</summary>
            <CodeBlock code={asInstalled(readSource(f.path))} title={installedPath(f)} className="border-0 border-t" maxHeight />
          </details>
        ))}
    </DocsPage>
  );
}
