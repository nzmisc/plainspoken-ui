import { BibleChapter } from "@/registry/plainspoken/blocks/bible/chapter";

const PSALM_23 = [
  "The LORD {is} my shepherd; I shall not want.",
  "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
  "He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.",
  "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou {art} with me; thy rod and thy staff they comfort me.",
  "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
  "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
];

/** Poetry: the psalm's title above verse 1, and each verse its own line with a hanging indent, whatever the layout setting. */
export default function BibleChapterPsalm() {
  return (
    <BibleChapter book={{ slug: "psalms", name: "Psalms" }} chapter={23} text={{ verses: PSALM_23, title: "A Psalm of David.", poetry: true }} as="h2" verseIdPrefix="psalm-23-v" />
  );
}
