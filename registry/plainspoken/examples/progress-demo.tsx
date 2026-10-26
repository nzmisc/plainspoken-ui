import { Progress } from "@/registry/plainspoken/ui/progress";

/** Determinate with the percentage, with your own text, and indeterminate (a still, hatched bar with reduced motion). */
export default function ProgressDemo() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Progress label="Uploading 24 photos" value={62} />
      <Progress label="Copying the backup" value={3.2} max={8} showValue="3.2 of 8 GB" />
      <Progress label="Waiting for the server" />
    </div>
  );
}
