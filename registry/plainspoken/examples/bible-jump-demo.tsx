import { BibleJump } from "@/registry/plainspoken/blocks/bible/jump";

const BOOKS = [
  { slug: "genesis", name: "Genesis", testament: "OT" as const, chapters: 50 },
  { slug: "ruth", name: "Ruth", testament: "OT" as const, chapters: 4 },
  { slug: "psalms", name: "Psalms", testament: "OT" as const, chapters: 150 },
  { slug: "john", name: "John", testament: "NT" as const, chapters: 21 },
  { slug: "revelation", name: "Revelation", testament: "NT" as const, chapters: 22 },
];

/** Choose a book and a chapter, then Go. Choosing Ruth while on chapter 23 resets the chapter to 1. */
export default function BibleJumpDemo() {
  return <BibleJump books={BOOKS} book="psalms" chapter={23} basePath="/demos/bible" />;
}
