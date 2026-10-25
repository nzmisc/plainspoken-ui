import { BibleSearchForm } from "@/registry/plainspoken/blocks/bible/search-form";

/** A GET form to the search page: try a word, a “quoted phrase” or a reference such as John 3:16. */
export default function BibleSearchFormDemo() {
  return <BibleSearchForm action="/demos/bible/search" />;
}
