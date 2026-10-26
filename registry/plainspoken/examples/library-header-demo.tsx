import { LibraryHeader } from "@/registry/plainspoken/blocks/library/header";

/** The catalogue's bar as on a title's page: the search box is in it, and the account menu opens from the name. */
export default function LibraryHeaderDemo() {
  return <LibraryHeader basePath="/demos/library" name="Lakemont Public Library" patron="Ada Okafor" pathname="/demos/library/book/beloved" />;
}
