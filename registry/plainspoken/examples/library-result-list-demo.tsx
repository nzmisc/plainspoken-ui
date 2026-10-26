import type { LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { LibraryResultList } from "@/registry/plainspoken/blocks/library/result-list";

const BRANCHES = [
  { id: "central", name: "Central Library" },
  { id: "riverside", name: "Riverside Branch" },
];

const BELOVED: LibraryBook = {
  id: "beloved",
  title: "Beloved",
  author: "Toni Morrison",
  year: 1987,
  language: "English",
  audience: "Adult",
  subjects: ["Literary fiction", "Historical fiction"],
  formats: ["book", "ebook", "audiobook"],
  description: "Years after escaping slavery, Sethe lives in a house in Ohio haunted by the daughter she lost, until a young woman arrives calling herself Beloved.",
  added: "2020-01-27",
};

const PARASITE: LibraryBook = {
  id: "parasite",
  title: "기생충",
  subtitle: "Parasite",
  author: "Bong Joon-ho",
  creatorRole: "Director",
  year: 2019,
  language: "Korean",
  audience: "Adult",
  subjects: ["Film", "Thriller"],
  formats: ["dvd"],
  description: "A poor family in Seoul gets itself hired, one member at a time, by a wealthy household, until a discovery in the basement changes everything.",
  added: "2020-06-22",
};

/** Two results: a book in three formats in different states, and a DVD with a queue. Place hold opens the hold dialog. */
export default function LibraryResultListDemo() {
  return (
    <LibraryResultList
      basePath="/demos/library"
      branches={BRANCHES}
      today="2026-10-24"
      results={[
        {
          book: BELOVED,
          availability: [
            { format: "book", total: 5, available: 2, holds: 0 },
            { format: "ebook", total: 3, available: 0, holds: 4 },
            { format: "audiobook", total: 1, available: 0, holds: 0 },
          ],
        },
        { book: PARASITE, availability: [{ format: "dvd", total: 2, available: 0, holds: 3 }] },
      ]}
    />
  );
}
