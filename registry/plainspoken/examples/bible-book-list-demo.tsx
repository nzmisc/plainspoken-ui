import { BibleBookList } from "@/registry/plainspoken/blocks/bible/book-list";
import type { BibleBook } from "@/registry/plainspoken/blocks/bible/lib";

const BOOKS: BibleBook[] = [
  { slug: "genesis", name: "Genesis", abbreviation: "Gen", testament: "OT", section: "Law", chapters: 50 },
  { slug: "exodus", name: "Exodus", abbreviation: "Exod", testament: "OT", section: "Law", chapters: 40 },
  { slug: "leviticus", name: "Leviticus", abbreviation: "Lev", testament: "OT", section: "Law", chapters: 27 },
  { slug: "ruth", name: "Ruth", abbreviation: "Ruth", testament: "OT", section: "History", chapters: 4 },
  { slug: "psalms", name: "Psalms", abbreviation: "Ps", testament: "OT", section: "Poetry", chapters: 150 },
  { slug: "matthew", name: "Matthew", abbreviation: "Matt", testament: "NT", section: "Gospels", chapters: 28 },
  { slug: "mark", name: "Mark", abbreviation: "Mark", testament: "NT", section: "Gospels", chapters: 16 },
  { slug: "luke", name: "Luke", abbreviation: "Luke", testament: "NT", section: "Gospels", chapters: 24 },
  { slug: "john", name: "John", abbreviation: "John", testament: "NT", section: "Gospels", chapters: 21 },
  { slug: "acts", name: "Acts", abbreviation: "Acts", testament: "NT", section: "History", chapters: 28 },
  { slug: "revelation", name: "Revelation", abbreviation: "Rev", testament: "NT", section: "Prophecy", chapters: 22 },
];

/** A few books from each testament, under their sections, with their chapter counts. Links go to the Bible demo. */
export default function BibleBookListDemo() {
  return <BibleBookList books={BOOKS} basePath="/demos/bible" />;
}
