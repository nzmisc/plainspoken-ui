import { LibrarySearchForm } from "@/registry/plainspoken/blocks/library/search-form";

/** The big search box from the catalogue's home page, and the compact one from its header. */
export default function LibrarySearchFormDemo() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <LibrarySearchForm action="/demos/library/search" size="lg" />
      <LibrarySearchForm action="/demos/library/search" compact size="sm" className="w-72" />
    </div>
  );
}
