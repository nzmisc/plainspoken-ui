// Math in a model's Markdown, made into the one form the math plugin reads: $$…$$. Models write
// TeX four ways, $…$, $$…$$, \(…\) and \[…\], and dollar signs also mean money. The plugin is
// left with single-dollar math off (so "$5 and $10" stays text), and this turns the forms that are
// clearly math into double dollars first. Code, fenced or inline, is never touched.

/** Characters that make \[…\] math rather than escaped brackets, as in "see \[1\]" */
const TEX = /[\\^_={}+<>|]/;

/** \[…\] becomes a display block, \(…\) inline math */
function bracketForms(text: string): string {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (all, body: string) => (TEX.test(body) || body.trim().length > 3 ? `\n$$\n${body.trim()}\n$$\n` : all))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$$${body.trim()}$$`);
}

/**
 * $…$ on one line becomes $$…$$ when it reads as math by Pandoc's rules: the opening $ has a
 * non-space after it, the closing one a non-space before it and no letter or digit after it, and
 * there is no other $ between them (nor a table cell's edge). "$5 and $10", "$HOME/$USER",
 * "$5/$10" and "| Ads ($) | Tools ($) |" stay as they are.
 */
function singleDollars(line: string): string {
  // In a table row, each cell on its own: "| Ads ($) | Tools ($) |" isn't one formula
  if (/^\s*\|/.test(line)) return line.split(/(?<!\\)\|/).map(pairDollars).join("|");
  return pairDollars(line);
}

function pairDollars(line: string): string {
  const runs: { at: number; len: number }[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== "$" || line[i - 1] === "\\") continue;
    let j = i;
    while (line[j] === "$") j++;
    runs.push({ at: i, len: j - i });
    i = j - 1;
  }
  const pairs = new Set<number>();
  for (let k = 0; k < runs.length - 1; k++) {
    const [a, b] = [runs[k], runs[k + 1]];
    if (a.len !== 1 || b.len !== 1 || b.at === a.at + 1) continue;
    // Nor does a formula start with closing punctuation or end with opening: "($) and ($)"
    const opens = !/[\s)\]},.;:!?]/.test(line[a.at + 1]);
    const closes = !/[\s([{]/.test(line[b.at - 1]) && !/[\p{L}\p{N}]/u.test(line[b.at + 1] ?? "");
    if (opens && closes) {
      pairs.add(a.at).add(b.at);
      k++;
    }
  }
  if (!pairs.size) return line;
  return [...line].map((c, i) => (pairs.has(i) ? "$$" : c)).join("");
}

/** Positions of unescaped $$ runs */
const doubles = (text: string) => [...text.matchAll(/(?<!\\)\${2,}/g)];

/** The math in a stretch of Markdown that holds no fenced code, with inline code kept aside */
function prose(text: string, last: boolean): string {
  // Inline code is swapped for numbered markers (private-use characters) and put back at the end
  const spans: string[] = [];
  let out = text.replace(/(`+)[\s\S]*?[^`]\1(?!`)/g, (m) => `\uE000${spans.push(m) - 1}\uE001`);
  out = bracketForms(out)
    .split("\n")
    .map((line) => {
      // A line that is only $$…$$ is a formula of its own: the plugin draws that inline unless the
      // $$ are on lines of their own
      const alone = /^\s*\$\$((?:(?!\$\$).)+)\$\$\s*$/.exec(line);
      return alone ? `$$\n${alone[1].trim()}\n$$` : singleDollars(line);
    })
    .join("\n");
  // While streaming, a $$ that hasn't closed yet shows as plain text, not as a formula half-written
  if (last) {
    const open = doubles(out);
    if (open.length % 2 === 1) {
      const m = open.at(-1)!;
      out = `${out.slice(0, m.index)}\\$\\$${out.slice(m.index + m[0].length)}`;
    }
  }
  return out.replace(/\uE000(\d+)\uE001/g, (_, i: string) => spans[Number(i)]);
}

/**
 * The Markdown with every formula as $$…$$ (display ones on lines of their own), ready for the
 * math plugin with single-dollar math off. With `streaming`, a formula still open at the end stays
 * plain text until it closes.
 */
export function prepareMath(markdown: string, streaming = false): string {
  if (!/[$\\]/.test(markdown)) return markdown;
  const out: string[] = [];
  let text: string[] = [];
  let fence: string | null = null;
  const flush = (last: boolean) => {
    if (text.length) out.push(prose(text.join("\n"), last));
    text = [];
  };
  for (const line of markdown.split("\n")) {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      out.push(line);
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && line.trim() === m[1]) fence = null;
    } else if (m) {
      flush(false);
      fence = m[1];
      out.push(line);
    } else text.push(line);
  }
  flush(streaming && fence === null);
  return out.join("\n");
}
