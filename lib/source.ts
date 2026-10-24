import { readFileSync } from "node:fs";
import { join } from "node:path";

/** A file of this repo, e.g. "registry/plainspoken/ui/button.tsx" */
export function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

/**
 * The imports as they read once the CLI has installed the files: @/registry/plainspoken/ui/x
 * becomes @/components/ui/x, lib becomes @/lib, hooks @/hooks, anything else @/components.
 */
export function asInstalled(code: string): string {
  return code
    .replaceAll("@/registry/plainspoken/ui/", "@/components/ui/")
    .replaceAll("@/registry/plainspoken/lib/", "@/lib/")
    .replaceAll("@/registry/plainspoken/hooks/", "@/hooks/")
    .replaceAll("@/registry/plainspoken/", "@/components/");
}

/** The doc comment just above `export default`, as plain text, or null */
export function defaultExportDoc(code: string): string | null {
  const m = code.match(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export default/);
  if (!m) return null;
  return m[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\* ?/, "").trim())
    .join(" ")
    .trim();
}

/** Same code without the doc comment above `export default`, which the page already shows as text */
export function withoutDefaultExportDoc(code: string): string {
  return code.replace(/\/\*\*(?:(?!\*\/)[\s\S])*\*\/\s*(export default)/, "$1");
}
