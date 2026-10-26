import { DocsNav } from "@/components/site/docs-nav";
import { docsNav } from "@/lib/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1240px] gap-8 px-4 pt-6 md:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="md:sticky md:top-0 md:max-h-screen md:overflow-y-auto md:py-1">
        <details className="md:hidden" >
          <summary className="cursor-pointer py-1 font-semibold">Docs menu</summary>
          <div className="pt-2 pb-4">
            <DocsNav sections={docsNav()} />
          </div>
        </details>
        <div className="hidden md:block">
          <DocsNav sections={docsNav()} />
        </div>
      </aside>
      {children}
    </div>
  );
}
