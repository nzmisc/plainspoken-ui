// Unit tests for registry/plainspoken/lib/diff.ts:   node --test scripts/diff.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diff,
  diffBlocks,
  diffChars,
  diffLines,
  diffSequences,
  diffSide,
  diffWords,
  joinBlocks,
  mapOffset,
  mapSelection,
  merge3,
  mergeBlocks,
  mergedBlocks,
  mergedText,
  splitBlocks,
  tokenize,
} from "../registry/plainspoken/lib/diff.ts";

/** A small seeded random generator, so failures repeat */
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function mutate(text: string, rand: () => number, edits: number): string {
  const words = ["red", "blue", "the", "a", " ", ",", "Friday", "Monday", "\n", "cat", "09:00"];
  let t = text;
  for (let i = 0; i < edits; i++) {
    const at = Math.floor(rand() * (t.length + 1));
    const kind = rand();
    if (kind < 0.4) t = t.slice(0, at) + words[Math.floor(rand() * words.length)] + t.slice(at);
    else if (kind < 0.7) t = t.slice(0, at) + t.slice(at + 1 + Math.floor(rand() * 6));
    else t = t.slice(0, at) + words[Math.floor(rand() * words.length)] + t.slice(at + 3);
  }
  return t;
}

test("tokenize joins back to the text", () => {
  const text = "Jonas's re-open at 09:00, 2.5 kg — done!\n  Next line 😀👍🏽";
  for (const g of ["char", "word", "line"] as const) assert.equal(tokenize(text, g).join(""), text);
  assert.deepEqual(tokenize("by 09:00, Jonas's", "word"), ["by", " ", "09:00", ",", " ", "Jonas's"]);
  assert.deepEqual(tokenize("a\nb\n", "line"), ["a\n", "b\n"]);
  assert.deepEqual(tokenize("", "word"), []);
  // Graphemes: the skin-tone emoji is one token
  assert.equal(tokenize("👍🏽", "char").length, 1);
});

test("diffSequences covers both sequences in order", () => {
  const a = "abcabba".split("");
  const b = "cbabac".split("");
  const r = diffSequences(a, b);
  let ai = 0;
  let bi = 0;
  for (const x of r) {
    assert.equal(x.aStart, ai);
    assert.equal(x.bStart, bi);
    if (x.equal) assert.deepEqual(a.slice(x.aStart, x.aEnd), b.slice(x.bStart, x.bEnd));
    ai = x.aEnd;
    bi = x.bEnd;
  }
  assert.equal(ai, a.length);
  assert.equal(bi, b.length);
  // The classic example has an edit distance of 5
  const edits = r.filter((x) => !x.equal).reduce((n, x) => n + (x.aEnd - x.aStart) + (x.bEnd - x.bStart), 0);
  assert.equal(edits, 5);
});

test("diff rebuilds both texts, at every granularity, on random edits", () => {
  const rand = rng(7);
  const base = "The spring sale starts on Friday 14 March at 09:00.\nThis page is the single list of what has to be ready.\n";
  for (let i = 0; i < 300; i++) {
    const a = mutate(base, rand, 1 + Math.floor(rand() * 4));
    const b = mutate(a, rand, 1 + Math.floor(rand() * 6));
    for (const g of ["char", "word", "line"] as const) {
      const parts = diff(a, b, g);
      assert.equal(diffSide(parts, "before"), a, `${g} before`);
      assert.equal(diffSide(parts, "after"), b, `${g} after`);
      for (let j = 1; j < parts.length; j++) assert.notEqual(parts[j].op, parts[j - 1].op, "adjacent parts differ");
    }
  }
});

test("word diff reads as replacements", () => {
  assert.deepEqual(diffWords("fix it by Friday.", "fix it by Monday."), [
    { op: "equal", text: "fix it by " },
    { op: "delete", text: "Friday" },
    { op: "insert", text: "Monday" },
    { op: "equal", text: "." },
  ]);
  // The space between two changed words folds into one change
  assert.deepEqual(diffWords("the quick brown fox", "the slow red fox"), [
    { op: "equal", text: "the " },
    { op: "delete", text: "quick brown" },
    { op: "insert", text: "slow red" },
    { op: "equal", text: " fox" },
  ]);
  assert.deepEqual(diffWords("same", "same"), [{ op: "equal", text: "same" }]);
  assert.deepEqual(diffWords("", "new"), [{ op: "insert", text: "new" }]);
  assert.deepEqual(diffLines("a\nb\nc\n", "a\nc\n"), [
    { op: "equal", text: "a\n" },
    { op: "delete", text: "b\n" },
    { op: "equal", text: "c\n" },
  ]);
  assert.deepEqual(diffChars("cat", "cart"), [
    { op: "equal", text: "ca" },
    { op: "insert", text: "r" },
    { op: "equal", text: "t" },
  ]);
});

test("merge3: changes in different places merge cleanly", () => {
  const base = "It happens on web and in the app. We should fix this before the sale on Friday.";
  const mine = "It happens on web and in the app. We should fix this before the sale on Thursday.";
  const theirs = "It happens on web and in the iOS app, not on Android. We should fix this before the sale on Friday.";
  const r = merge3(base, mine, theirs);
  assert.equal(r.conflicts, 0);
  assert.equal(mergedText(r), "It happens on web and in the iOS app, not on Android. We should fix this before the sale on Thursday.");
  assert.ok(r.chunks.some((c) => c.type === "clean" && c.from === "mine"));
  assert.ok(r.chunks.some((c) => c.type === "clean" && c.from === "theirs"));
});

test("merge3: the same words changed differently conflict, and only those words", () => {
  const base = "before the spring sale on Friday.";
  const mine = "before the spring sale on Thursday.";
  const theirs = "before the spring sale starts on Monday.";
  const r = merge3(base, mine, theirs);
  assert.equal(r.conflicts, 1);
  const c = r.chunks.find((x) => x.type === "conflict");
  assert.deepEqual(c, { type: "conflict", base: "Friday", mine: "Thursday", theirs: "Monday" });
  // " starts" came from theirs and merged cleanly
  assert.equal(mergedText(r, "mine"), "before the spring sale starts on Thursday.");
  assert.equal(mergedText(r, "theirs"), "before the spring sale starts on Monday.");
  assert.equal(mergedText(r, "both"), "before the spring sale starts on Thursday Monday.");
  assert.equal(mergedText(r, () => "Tuesday"), "before the spring sale starts on Tuesday.");
});

test("merge3: identical changes on both sides are one clean change", () => {
  const r = merge3("on Friday", "on Monday", "on Monday");
  assert.equal(r.conflicts, 0);
  assert.equal(mergedText(r), "on Monday");
  assert.ok(r.chunks.some((c) => c.type === "clean" && c.from === "both"));
});

test("merge3: two insertions at the same place conflict", () => {
  const r = merge3("a b", "a x b", "a y b");
  assert.equal(r.conflicts, 1);
  assert.equal(mergedText(r, "both"), "a x y b");
});

test("merge3: a deletion against an edit inside it conflicts", () => {
  const r = merge3("fix this by Friday at noon.", "fix this.", "fix this by Monday at noon.");
  assert.equal(r.conflicts, 1);
});

test("merge3: a deletion by one side is a chunk, with what it removed", () => {
  const r = merge3("One two three", "One two three!", "two three");
  assert.equal(mergedText(r), "two three!");
  assert.deepEqual(r.chunks[0], { type: "clean", text: "", from: "theirs", base: "One " });
});

test("merge3: no-op sides", () => {
  assert.equal(mergedText(merge3("abc def", "abc def", "abc xyz")), "abc xyz");
  assert.equal(mergedText(merge3("abc def", "abc xyz", "abc def")), "abc xyz");
  assert.equal(mergedText(merge3("", "mine", "")), "mine");
  assert.equal(merge3("", "mine", "theirs").conflicts, 1);
});

test("merge3: random edits keep each side's untouched changes", () => {
  const rand = rng(42);
  const base = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen.";
  for (let i = 0; i < 300; i++) {
    const mine = mutate(base, rand, 1 + Math.floor(rand() * 3));
    const theirs = mutate(base, rand, 1 + Math.floor(rand() * 3));
    for (const g of ["char", "word", "line"] as const) {
      const r = merge3(base, mine, theirs, g);
      // Taking mine for every conflict when theirs didn't change anything gives mine, and the other way round
      if (theirs === base) assert.equal(mergedText(r, "theirs"), mine);
      if (mine === base) assert.equal(mergedText(r, "mine"), theirs);
      // Settling every conflict with a side rebuilds that side when the other side made no clean
      // changes (deletions included: they are chunks with no text)
      const onlyMine = r.chunks.every((c) => c.type !== "clean" || c.from !== "theirs");
      if (onlyMine) assert.equal(mergedText(r, "mine"), mine, `${g} mine`);
      const onlyTheirs = r.chunks.every((c) => c.type !== "clean" || c.from !== "mine");
      if (onlyTheirs) assert.equal(mergedText(r, "theirs"), theirs, `${g} theirs`);
    }
  }
});

test("mapOffset and mapSelection keep a caret on its words", () => {
  const before = "fix it by Friday please";
  const after = "please fix it by Friday please";
  const caret = before.indexOf("Friday");
  const sel = mapSelection(before, after, { start: caret, end: caret });
  assert.equal(after.slice(sel.start, sel.start + 6), "Friday");
  // Text typed at the caret by someone else goes after it
  const at = "ab".length;
  assert.deepEqual(mapSelection("abcd", "abXYcd", { start: at, end: at }), { start: 2, end: 2 });
  // A selection doesn't grow to take in text inserted at its edges
  assert.deepEqual(mapSelection("abcd", "aXbcYd", { start: 1, end: 3 }), { start: 2, end: 4 });
  // Inside deleted text the caret goes to where the deletion was
  const parts = diffChars("hello world", "hello");
  assert.equal(mapOffset(parts, 8), 5);
  // Past the end
  assert.equal(mapOffset(diffChars("abc", "xabc"), 3), 4);
});

const DOC = `# Spring sale

The sale starts on Friday at 09:00.

## Before launch

- Prices loaded (Jonas)
- Banner signed off
- Support macros updated

\`\`\`
code

with a blank line
\`\`\`

After the sale we review the numbers.`;

test("splitBlocks and joinBlocks", () => {
  const blocks = splitBlocks(DOC);
  assert.deepEqual(blocks.slice(0, 6), [
    "# Spring sale",
    "The sale starts on Friday at 09:00.",
    "## Before launch",
    "- Prices loaded (Jonas)",
    "- Banner signed off",
    "- Support macros updated",
  ]);
  assert.equal(blocks[6], "```\ncode\n\nwith a blank line\n```");
  assert.equal(blocks.length, 8);
  assert.equal(joinBlocks(blocks), DOC);
  assert.deepEqual(splitBlocks("\n\none\n\n\n"), ["one"]);
});

test("mergeBlocks: different blocks merge; different sentences of one block merge word by word", () => {
  const mine = DOC.replace("Banner signed off", "Banner signed off by Amara").replace("on Friday", "on Thursday");
  const theirs = DOC.replace("Support macros updated", "Support macros updated for returns").replace("we review", "we send thanks and review");
  const r = mergeBlocks(DOC, mine, theirs);
  assert.equal(r.conflicts, 0);
  const text = mergedBlocks(r);
  assert.ok(text.includes("Banner signed off by Amara"));
  assert.ok(text.includes("Support macros updated for returns"));
  assert.ok(text.includes("on Thursday"));
  assert.ok(text.includes("we send thanks and review"));

  // Same paragraph, different words: still clean
  const m2 = DOC.replace("on Friday", "on Thursday");
  const t2 = DOC.replace("The sale starts", "The spring sale starts");
  const r2 = mergeBlocks(DOC, m2, t2);
  assert.equal(r2.conflicts, 0);
  assert.ok(mergedBlocks(r2).includes("The spring sale starts on Thursday at 09:00."));
});

test("mergeBlocks: the same words in one block conflict at the block level", () => {
  const mine = DOC.replace("at 09:00", "at 08:00");
  const theirs = DOC.replace("at 09:00", "at 10:00").replace("Banner signed off", "Banner signed off (done)");
  const r = mergeBlocks(DOC, mine, theirs);
  assert.equal(r.conflicts, 1);
  const c = r.chunks.find((x) => x.type === "conflict");
  assert.deepEqual(c, {
    type: "conflict",
    base: ["The sale starts on Friday at 09:00."],
    mine: ["The sale starts on Friday at 08:00."],
    theirs: ["The sale starts on Friday at 10:00."],
  });
  const both = mergedBlocks(r, "both");
  assert.ok(both.includes("at 08:00.\n\nThe sale starts on Friday at 10:00."));
  assert.ok(both.includes("Banner signed off (done)"));
});

test("diffBlocks pairs changed blocks", () => {
  const after = DOC.replace("Banner signed off", "Banner signed off by Amara").replace("- Support macros updated\n", "");
  const rows = diffBlocks(DOC, after);
  const change = rows.find((r) => r.op === "change");
  assert.ok(change && change.op === "change" && change.after === "- Banner signed off by Amara");
  assert.ok(rows.some((r) => r.op === "delete" && r.before === "- Support macros updated"));
  assert.equal(rows.filter((r) => r.op === "equal").length, 6);
});
