import { Button } from "@/registry/plainspoken/ui/button";
import { LibraryBookDetails } from "@/registry/plainspoken/blocks/library/book-details";

/** A title's page header: cover, title, author, where each format stands, description, actions and the facts. */
export default function LibraryBookDetailsDemo() {
  return (
    <LibraryBookDetails
      searchPath="/demos/library/search"
      callNumber="FIC LEG"
      book={{
        id: "the-left-hand-of-darkness",
        title: "The Left Hand of Darkness",
        author: "Ursula K. Le Guin",
        year: 1969,
        language: "English",
        audience: "Adult",
        subjects: ["Science fiction"],
        formats: ["book", "ebook"],
        description: "An envoy comes to the frozen planet Gethen, whose people have no fixed sex, and must learn to trust one of them on a long journey across the ice.",
        added: "2020-09-14",
      }}
      availability={[
        { format: "book", total: 3, available: 1, holds: 0 },
        { format: "ebook", total: 2, available: 0, holds: 5 },
      ]}
      actions={<Button variant="primary">Place hold</Button>}
    />
  );
}
