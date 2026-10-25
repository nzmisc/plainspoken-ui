import { Tooltip } from "@/registry/plainspoken/ui/tooltip";

/** On a word in running text. Plain text isn't focusable, so give it tabIndex for keyboard users. */
export default function TooltipInText() {
  return (
    <p className="max-w-prose">
      Invoices are sent as{" "}
      <Tooltip content="PDF/A-3 with the invoice data embedded as XML, as EU e-invoicing asks for">
        <abbr tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-2">
          ZUGFeRD
        </abbr>
      </Tooltip>{" "}
      files, which most accounting software in Germany and France reads directly.
    </p>
  );
}
