import { BibleChapter } from "@/registry/plainspoken/blocks/bible/chapter";

const RUTH_1 = [
  "Now it came to pass in the days when the judges ruled, that there was a famine in the land. And a certain man of Beth-lehem-judah went to sojourn in the country of Moab, he, and his wife, and his two sons.",
  "And the name of the man {was} Elimelech, and the name of his wife Naomi, and the name of his two sons Mahlon and Chilion, Ephrathites of Beth-lehem-judah. And they came into the country of Moab, and continued there.",
  "And Elimelech Naomi’s husband died; and she was left, and her two sons.",
  "And they took them wives of the women of Moab; the name of the one {was} Orpah, and the name of the other Ruth: and they dwelled there about ten years.",
  "And Mahlon and Chilion died also both of them; and the woman was left of her two sons and her husband.",
  "Then she arose with her daughters in law, that she might return from the country of Moab: for she had heard in the country of Moab how that the LORD had visited his people in giving them bread.",
];

/** The first verses of Ruth: paragraphs, raised verse numbers that link to each verse, and the translators' added words in italics. */
export default function BibleChapterDemo() {
  return <BibleChapter book={{ slug: "ruth", name: "Ruth", title: "The Book of Ruth" }} chapter={1} text={{ verses: RUTH_1, paragraphs: [1, 6] }} as="h2" verseIdPrefix="ruth-1-v" />;
}
