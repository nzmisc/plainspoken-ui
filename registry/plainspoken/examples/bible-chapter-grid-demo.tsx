import { BibleChapterGrid } from "@/registry/plainspoken/blocks/bible/chapter-grid";

/** Genesis's 50 chapters, with chapter 3 marked as the one being read. The grid fills the width it has. */
export default function BibleChapterGridDemo() {
  return <BibleChapterGrid book={{ slug: "genesis", name: "Genesis", chapters: 50 }} current={3} basePath="/demos/bible" className="max-w-xl" />;
}
