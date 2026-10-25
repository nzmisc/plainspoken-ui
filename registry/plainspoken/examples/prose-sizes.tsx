import { Prose } from "@/registry/plainspoken/ui/prose";

function Passage() {
  return (
    <>
      <h3>In the beginning</h3>
      <p>
        In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon
        the face of the deep.
      </p>
    </>
  );
}

/** sm (13px) for notes inside a panel, base (14px, the body size), lg (17px) for long reading. Everything inside scales with it. */
export default function ProseSizes() {
  return (
    <div className="flex flex-col gap-4">
      {(["sm", "base", "lg"] as const).map((size) => (
        <div key={size}>
          <p className="mb-1 font-mono text-[12px] text-muted-foreground">size=&quot;{size}&quot;</p>
          <Prose size={size}>
            <Passage />
          </Prose>
        </div>
      ))}
    </div>
  );
}
