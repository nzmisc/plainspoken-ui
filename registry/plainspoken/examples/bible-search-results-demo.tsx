import type { BibleBook } from "@/registry/plainspoken/blocks/bible/lib";
import { searchBible } from "@/registry/plainspoken/blocks/bible/search";
import { BibleSearchResults } from "@/registry/plainspoken/blocks/bible/search-results";

const RUTH: BibleBook = { slug: "ruth", name: "Ruth", abbreviation: "Ruth", testament: "OT", section: "History", chapters: 1 };
const JOHN: BibleBook = { slug: "john", name: "John", abbreviation: "John", testament: "NT", section: "Gospels", chapters: 1 };

const SOURCES = [
  {
    book: RUTH,
    chapters: [
      {
        verses: [
          "And Ruth said, Intreat me not to leave thee, {or} to return from following after thee: for whither thou goest, I will go; and where thou lodgest, I will lodge: thy people {shall be} my people, and thy God my God:",
          "Where thou diest, will I die, and there will I be buried: the LORD do so to me, and more also, {if ought} but death part thee and me.",
        ],
      },
    ],
  },
  {
    book: JOHN,
    chapters: [
      {
        verses: [
          "In the beginning was the Word, and the Word was with God, and the Word was God.",
          "The same was in the beginning with God.",
          "All things were made by him; and without him was not any thing made that was made.",
          "In him was life; and the life was the light of men.",
        ],
      },
    ],
  },
];

/** Results for “god”, from two short passages: counts per testament and per book, the matches marked, links to each verse. */
export default function BibleSearchResultsDemo() {
  const result = searchBible(SOURCES, "god");
  return <BibleSearchResults result={result} basePath="/demos/bible" searchPath="/demos/bible/search" />;
}
