import { BibleBookIntro } from "@/registry/plainspoken/blocks/bible/book-intro";

/** The top of a book's page: name, the KJV's own title, a description, the facts and a way in. */
export default function BibleBookIntroDemo() {
  return (
    <BibleBookIntro
      basePath="/demos/bible"
      book={{ slug: "ruth", name: "Ruth", title: "The Book of Ruth", abbreviation: "Ruth", testament: "OT", section: "History", chapters: 4, verses: 85 }}
      description="A short story set in the time of the judges: the Moabite widow Ruth stays with her mother-in-law Naomi, gleans in the fields of Boaz in Bethlehem, and becomes the great-grandmother of King David."
    />
  );
}
