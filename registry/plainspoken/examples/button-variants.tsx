import { Button, IconButton, type ButtonVariant } from "@/registry/plainspoken/ui/button";
import { RefreshCw } from "@/registry/plainspoken/lib/icons";

const VARIANTS: { variant: ButtonVariant; use: string }[] = [
  { variant: "default", use: "Most actions" },
  { variant: "primary", use: "The one main action in a view" },
  { variant: "secondary", use: "Next to a primary; inside bordered things" },
  { variant: "outline", use: "Quieter than default" },
  { variant: "destructive", use: "Deleting, and anything that can't be undone" },
  { variant: "ghost", use: "Toolbars and table cells" },
  { variant: "link", use: "Actions inside running text" },
];

/** Every variant has a 1px border (transparent where none shows), so switching variant never moves anything. */
export default function ButtonVariants() {
  return (
    <table className="text-[14px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
      <thead>
        <tr>
          <th>Variant</th>
          <th>For</th>
          <th>Button</th>
          <th>Icon</th>
          <th>Disabled</th>
        </tr>
      </thead>
      <tbody>
        {VARIANTS.map(({ variant, use }) => (
          <tr key={variant}>
            <td>
              <code className="font-mono text-[13px]">{variant}</code>
            </td>
            <td>{use}</td>
            <td>
              <Button size="sm" variant={variant} icon={RefreshCw}>
                Refresh
              </Button>
            </td>
            <td>{variant !== "link" && <IconButton size="sm" variant={variant} icon={RefreshCw} label="Refresh" />}</td>
            <td>
              <Button size="sm" variant={variant} disabled>
                Refresh
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
