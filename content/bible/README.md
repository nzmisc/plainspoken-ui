# King James Version text

The text of the Bible demo (`/demos/bible`): the King James Version (Authorized Version), in the
standardized text of 1769, the 66 books of the Protestant canon.

- **Source**: eBible.org, "King James Version + Apocrypha" (ID `eng-kjv`), USFM edition:
  <https://ebible.org/Scriptures/eng-kjv_usfm.zip>, details at <https://ebible.org/find/details.php?id=eng-kjv>.
  The text there comes from the CrossWire Bible Society's KJV module.
- **Fetched**: 2026-10-25 (the download was last modified 2026-10-21; eBible lists the text as updated 2026-09-26).
  SHA-256 of the zip: `67561758cf58d9e767e89226a99171dba722579157d3894767c2f27538bcb38e`.
- **License**: public domain. eBible.org marks it "Public Domain". In the United Kingdom the KJV is
  still under Crown letters patent: printing it there, or importing printed copies, needs permission
  from the patent holders (Cambridge University Press, Oxford University Press, Collins). That has no
  effect elsewhere, and this demo prints nothing.

## Files

- `books.json`: the 66 books in canonical order: `slug`, `name`, `title` (the KJV's own title,
  "The First Book of Moses, called Genesis"), `abbreviation`, `testament` (`OT`/`NT`), `section`
  (Law, History, Poetry, Major Prophets, Minor Prophets, Gospels, History, Pauline Epistles, General
  Epistles, Prophecy), `chapters` and `verses` counts.
- `kjv/<slug>.json`: one per book, `{ slug, name, title, chapters }`. Each chapter is
  `{ verses, paragraphs, title?, headings?, postscript?, poetry? }`:
  - `verses`: verse n is at index n-1. Words the translators supplied, which KJV printings set in
    italics, are wrapped in `{braces}`. "LORD" is in capitals, as printed in small capitals.
  - `paragraphs`: the verses that start a paragraph (stanzas in the Psalms), from the USFM `\p` and
    `\b` markers.
  - `title`: a psalm's superscription ("A Psalm of David."), printed above verse 1.
  - `headings`: headings before a verse, by verse number: the Hebrew letters of Psalm 119.
  - `postscript`: the note after the last verse of most epistles ("Written to the Romans from
    Corinthus…").
  - `poetry`: set on the Psalms, where every verse is its own line.
- `descriptions.json`: a short description of each book, written for this demo.

Left out: the Apocrypha (in the download, not part of this demo), the translators' marginal notes
(USFM footnotes), Strong's numbers, the red letters of the words of Jesus and the pilcrows (¶),
whose paragraphs are kept as `paragraphs`.

## Counts

66 books, 1,189 chapters, 31,102 verses (Old Testament: 39 books, 929 chapters, 23,145 verses; New
Testament: 27 books, 260 chapters, 7,957 verses). These are the usual KJV figures; the import checks
that every chapter and verse number follows the one before.

## Regenerating

Put the download in a new, empty folder and unzip it there; the conversion only reads the `.usfm`
files as text.

```sh
mkdir /tmp/kjv && cd /tmp/kjv
curl -LO https://ebible.org/Scriptures/eng-kjv_usfm.zip
unzip eng-kjv_usfm.zip -d usfm
cd -   # back to the repository
node scripts/bible-import.ts /tmp/kjv/usfm content/bible
```

It rewrites `books.json` and `kjv/*.json`, prints the counts, and stops with an error on anything in
the USFM it doesn't know how to handle.
