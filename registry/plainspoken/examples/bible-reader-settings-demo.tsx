import { BibleChapter } from "@/registry/plainspoken/blocks/bible/chapter";
import { BibleReaderSettings } from "@/registry/plainspoken/blocks/bible/reader-settings";

/**
 * Change the size, typeface, layout or verse numbers and the text below follows at once. The
 * settings are data attributes on <html>, so they hold on every chapter of the page you open next.
 */
export default function BibleReaderSettingsDemo() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <BibleReaderSettings size="sm" />
      </div>
      <BibleChapter
        book={{ slug: "john", name: "John" }}
        chapter={11}
        showBookTitle={false}
        as="h2"
        verseIdPrefix="john-11-v"
        text={{
          verses: [
            "Now a certain {man} was sick, {named} Lazarus, of Bethany, the town of Mary and her sister Martha.",
            "Jesus wept.",
            "Then said the Jews, Behold how he loved him!",
          ],
        }}
      />
    </div>
  );
}
