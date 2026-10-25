import Form from "next/form";
import { Search } from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

export interface LibrarySearchFormProps {
  /** The search page's URL; the words go to it as ?q= and the field as ?in= */
  action?: string;
  defaultValue?: string;
  /** Which field to search: keyword (default), title, author or subject */
  defaultScope?: string;
  /** Leave out the field select, for a small box in a header */
  compact?: boolean;
  size?: ControlSize;
  className?: string;
}

/**
 * The catalogue search box: what to search in (keyword, title, author, subject), the words, and
 * a Search button. A GET form, so it works without script and every search is a URL; with
 * script, next/form loads the results without a full page load. A role="search" landmark.
 */
export function LibrarySearchForm({ action = "/library/search", defaultValue, defaultScope = "keyword", compact = false, size, className }: LibrarySearchFormProps) {
  return (
    <Form action={action} role="search" data-slot="library-search-form" className={cn("flex w-full gap-1.5", controlSize(size), className)}>
      {!compact && (
        <Select
          name="in"
          aria-label="Search in"
          defaultValue={defaultScope}
          options={[
            { value: "keyword", label: "Keyword" },
            { value: "title", label: "Title" },
            { value: "author", label: "Author" },
            { value: "subject", label: "Subject" },
          ]}
        />
      )}
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        prefix={Search}
        aria-label="Search the catalogue"
        placeholder={compact ? "Search the catalogue" : "Titles, authors, subjects…"}
        enterKeyHint="search"
        className="min-w-0 flex-1"
      />
      <Button type="submit" variant="primary">
        Search
      </Button>
    </Form>
  );
}
