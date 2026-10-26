import { ArrowRight, ChevronDown, Copy, Ellipsis, Trash } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";

export default function ButtonIcons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button icon={Copy}>Copy</Button>
      <Button iconEnd={ChevronDown}>Options</Button>
      <Button variant="primary" iconEnd={ArrowRight}>
        Continue
      </Button>
      <IconButton icon={Ellipsis} label="More actions" />
      <IconButton variant="ghost" icon={Trash} label="Delete" />
      <IconButton variant="destructive" icon={Trash} label="Delete for good" />
    </div>
  );
}
