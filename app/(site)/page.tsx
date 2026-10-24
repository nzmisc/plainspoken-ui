import Link from "next/link";
import { DEMOS } from "@/lib/demos";
import { registryItemUrl } from "@/lib/site";
import { componentEntries } from "@/lib/docs-nav";
import { Command } from "@/components/site/code-block";
import { HomeSampler } from "@/components/site/home-sampler";
import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { buttonVariants } from "@/registry/plainspoken/ui/button";

export default function Home() {
  const count = componentEntries().length;
  return (
    <main className="mx-auto max-w-[1240px] px-4">
      <section className="grid gap-8 border-b border-border py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight sm:text-[44px]">
            Plain, dense, accessible components for React.
          </h1>
          <p className="max-w-[56ch] text-[17px] leading-relaxed text-muted-foreground">
            Square corners, gray buttons with borders, tables with lines, and links that turn purple once you&apos;ve
            visited them. {count} components on one height scale, copied into your app with the shadcn CLI and yours from
            then on.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/docs/installation" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Get started <Icon icon={ArrowRight} />
            </Link>
            <Link href="/docs/components" className={buttonVariants({ size: "lg" })}>
              Components
            </Link>
            <Link href="/customize" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Customize
            </Link>
          </div>
          <div className="max-w-xl">
            <Command>{`npx shadcn@latest add ${registryItemUrl("button")}`}</Command>
          </div>
        </div>
        <HomeSampler />
      </section>

      <section className="py-10">
        <h2 className="text-[22px] font-bold">Demos</h2>
        <p className="mt-1 text-muted-foreground">Whole apps built from nothing but these components.</p>
        <ul className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.map((d) => (
            <li key={d.slug} className="bg-background p-4">
              <Link href={`/demos/${d.slug}`} className="font-semibold text-link underline visited:text-link-visited">
                {d.title}
              </Link>
              <p className="mt-1 text-[13px]">{d.summary}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{d.shows}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 border-t border-border py-10 md:grid-cols-3">
        {[
          ["One height scale", "Every control of one size is exactly 20, 24, 28 or 36px tall, so a button, an input and a select in a row line up to the pixel."],
          ["Native elements", "Dialogs are <dialog>, selects are <select>, accordions are <details>. The browser does the hard parts; there are no UI primitives to install."],
          ["shadcn-compatible", "Same token names, same CLI, same .dark class. Themes made for shadcn/ui work, and both libraries can share an app."],
        ].map(([title, text]) => (
          <div key={title}>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
