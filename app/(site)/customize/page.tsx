import type { Metadata } from "next";
import { DocsPage, P } from "@/components/site/docs";

export const metadata: Metadata = { title: "Customize", description: "Pick a base gray, a main colour, link colours and fonts, and get the CSS or a shadcn command." };

export default function Customize() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-6">
      <DocsPage title="Customize" lead="Coming next.">
        <P>The theme customizer goes here.</P>
      </DocsPage>
    </main>
  );
}
