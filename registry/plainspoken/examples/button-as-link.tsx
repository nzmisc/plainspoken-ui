import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";

/** A link that looks like a button: buttonVariants() on an <a> (or your router's Link). */
export default function ButtonAsLink() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href="#get-started" className={buttonVariants({ variant: "primary", size: "lg" })}>
        Get started <Icon icon={ArrowRight} />
      </a>
      <a href="#docs" className={buttonVariants({ size: "lg" })}>
        Read the docs
      </a>
    </div>
  );
}
