import { BibleChapterPager } from "@/registry/plainspoken/blocks/bible/chapter-pager";

/** At the end of a book the pager crosses into the next one. Arrow keys are off here, since the docs page has several examples. */
export default function BibleChapterPagerDemo() {
  return (
    <BibleChapterPager
      prev={{ slug: "genesis", name: "Genesis", chapter: 49 }}
      next={{ slug: "exodus", name: "Exodus", chapter: 1 }}
      basePath="/demos/bible"
      keys={false}
      className="max-w-xl"
    />
  );
}
