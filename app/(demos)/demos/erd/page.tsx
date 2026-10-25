import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { ErdApp } from "@/registry/plainspoken/blocks/erd/erd-app";

export const metadata: Metadata = {
  title: "ERD",
  description:
    "An entity-relationship diagram editor built from plainspoken-ui: pan and zoom a canvas, drag tables, follow foreign keys drawn in crow's foot notation, edit the schema, and import or export Postgres SQL.",
};

export default function ErdPage() {
  return <ErdApp storageKey="plainspoken-erd" actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]" />;
}
