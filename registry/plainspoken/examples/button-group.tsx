import { Bold, Italic, Underline } from "@/registry/plainspoken/lib/icons";
import { Button, ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";

export default function ButtonGroupExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonGroup label="Text style">
        <IconButton icon={Bold} label="Bold" />
        <IconButton icon={Italic} label="Italic" />
        <IconButton icon={Underline} label="Underline" />
      </ButtonGroup>
      <ButtonGroup label="History" size="sm">
        <Button>Undo</Button>
        <Button>Redo</Button>
      </ButtonGroup>
    </div>
  );
}
