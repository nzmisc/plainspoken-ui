import Form from "next/form";
import { Search } from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { cn } from "@/lib/utils";

export interface BibleSearchFormProps {
  /** The search page's URL; the words go to it as ?q= */
  action?: string;
  /** What was searched for, to show in the box */
  defaultValue?: string;
  /** Keep a testament filter ("OT", "NT") when searching again */
  testament?: string;
  placeholder?: string;
  size?: ControlSize;
  /** Put the cursor in the box when the page loads (a search page; not a page people read) */
  autoFocus?: boolean;
  className?: string;
}

/**
 * The search box: a GET form to the search page, so it works before (and without) script, and a
 * search is a URL that can be bookmarked and shared. With script, next/form fetches the results
 * page without a full reload. A role="search" landmark.
 */
export function BibleSearchForm({
  action = "/bible/search",
  defaultValue,
  testament,
  placeholder = "Words, a “phrase”, or a reference like John 3:16",
  size,
  autoFocus,
  className,
}: BibleSearchFormProps) {
  return (
    <Form action={action} role="search" data-slot="bible-search-form" className={cn("flex w-full max-w-xl gap-1.5", controlSize(size), className)}>
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        prefix={Search}
        aria-label="Search the Bible"
        placeholder={placeholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className="min-w-0 flex-1"
      />
      {testament && <input type="hidden" name="t" value={testament} />}
      <Button type="submit" variant="primary">
        Search
      </Button>
    </Form>
  );
}
