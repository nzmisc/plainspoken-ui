// Tests for registry/plainspoken/lib/markdown.ts, the rich text editor's Markdown: parsing,
// safe HTML, reading HTML back (the editor's own and pasted), and round trips.
//
//   node scripts/test-markdown.ts
//
// No test runner and no DOM: a small HTML parser below builds the trees the reader reads.
import { countWords, htmlToMarkdown, markdownToHtml, markdownToText, parseMarkdown, safeUrl, toMarkdown, type DomLike, type MdBlock, type MdInline } from "../registry/plainspoken/lib/markdown.ts";

const { KITCHEN_SINK, DOCS } = await import("../registry/plainspoken/blocks/editor/data.ts");

let failed = 0;
let passed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = typeof got === "string" ? got : JSON.stringify(got);
  const w = typeof want === "string" ? want : JSON.stringify(want);
  if (g === w) passed++;
  else {
    failed++;
    console.log(`FAIL ${name}\n  got:  ${JSON.stringify(g)}\n  want: ${JSON.stringify(w)}`);
  }
}

// ---------------------------------------------------------------------------------------------
// A small parser for well-formed HTML, enough for the reader

const VOID = new Set(["br", "img", "hr", "input", "meta", "link", "col", "wbr"]);
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
const decode = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e] ?? m)));

interface El extends DomLike {
  childNodes: DomLike[];
}
function html(src: string): El {
  const root: El = { nodeType: 1, nodeName: "DIV", nodeValue: null, childNodes: [], getAttribute: () => null };
  const stack: El[] = [root];
  const re = /<!--[\s\S]*?-->|<\/(\w+)\s*>|<(\w+)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>|([^<]+)/g;
  for (const m of src.matchAll(re)) {
    const top = stack[stack.length - 1];
    if (m[4] != null) top.childNodes.push({ nodeType: 3, nodeName: "#text", nodeValue: decode(m[4]), childNodes: [] });
    else if (m[1]) {
      const name = m[1].toUpperCase();
      const at = stack.map((e) => e.nodeName).lastIndexOf(name);
      if (at > 0) stack.length = at;
    } else if (m[2]) {
      const attrs = new Map<string, string>();
      for (const a of (m[3] ?? "").matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs.set(a[1].toLowerCase(), decode(a[2] ?? a[3] ?? a[4] ?? ""));
      const el: El = { nodeType: 1, nodeName: m[2].toUpperCase(), nodeValue: null, childNodes: [], getAttribute: (n) => attrs.get(n) ?? null };
      top.childNodes.push(el);
      if (!VOID.has(m[2].toLowerCase()) && !m[0].endsWith("/>")) stack.push(el);
    }
  }
  return root;
}
const fromHtml = (s: string) => htmlToMarkdown(html(s));

// ---------------------------------------------------------------------------------------------
// Markdown → HTML

const H = (md: string) => markdownToHtml(md);

eq("paragraph", H("Hello, world."), "<p>Hello, world.</p>");
eq("soft break", H("one\ntwo"), "<p>one\ntwo</p>");
eq("hard break (spaces)", H("one  \ntwo"), "<p>one<br>two</p>");
eq("hard break (backslash)", H("one\\\ntwo"), "<p>one<br>two</p>");
eq("headings", H("# One\n## Two ##\n### Three"), "<h1>One</h1><h2>Two</h2><h3>Three</h3>");
eq("setext", H("Title\n=====\n\nSub\n---"), "<h1>Title</h1><h2>Sub</h2>");
eq("not a heading", H("#5 is a number"), "<p>#5 is a number</p>");
eq("emphasis", H("*a* _b_ **c** __d__ ~~e~~"), "<p><em>a</em> <em>b</em> <strong>c</strong> <strong>d</strong> <del>e</del></p>");
eq("nested emphasis", H("***a*** **b *c* d** *e **f***"), "<p><em><strong>a</strong></em> <strong>b <em>c</em> d</strong> <em>e <strong>f</strong></em></p>");
eq("intraword underscore", H("snake_case_name and 2*3*4"), "<p>snake_case_name and 2<em>3</em>4</p>");
eq("unmatched", H("a * b ** c"), "<p>a * b ** c</p>");
eq("code span", H("Use `npm run dev` or `` a`b ``."), "<p>Use <code>npm run dev</code> or <code>a`b</code>.</p>");
eq("code span escapes", H("`<b>` and `*x*`"), "<p><code>&lt;b&gt;</code> and <code>*x*</code></p>");
eq("escapes", H("\\*not\\* \\# \\[x\\]"), "<p>*not* # [x]</p>");
eq("link", H('[Docs](https://example.com/docs "The docs")'), '<p><a href="https://example.com/docs" title="The docs">Docs</a></p>');
eq("link with parens", H("[a](https://x.example/a_(b))"), '<p><a href="https://x.example/a_(b)">a</a></p>');
eq("link angle", H("[a](<https://x.example/a b>)"), '<p><a href="https://x.example/a b">a</a></p>');
eq("reference link", H("See [the guide][g] and [g].\n\n[g]: https://x.example/guide"), '<p>See <a href="https://x.example/guide">the guide</a> and <a href="https://x.example/guide">g</a>.</p>');
eq("autolink", H("<https://x.example> <ana@x.example>"), '<p><a href="https://x.example">https://x.example</a> <a href="mailto:ana@x.example">ana@x.example</a></p>');
eq("bare url", H("Go to https://x.example/path. Then (https://x.example/b)"), '<p>Go to <a href="https://x.example/path">https://x.example/path</a>. Then (<a href="https://x.example/b">https://x.example/b</a>)</p>');
eq("image", H('![A harbour](/img/harbour.svg "Dusk")'), '<p><img src="/img/harbour.svg" alt="A harbour" title="Dusk"></p>');
eq("image alt markup", H("![a *b* `c`](x.png)"), '<p><img src="x.png" alt="a b c"></p>');
eq("link in image text", H("[![logo](l.png)](https://x.example)"), '<p><a href="https://x.example"><img src="l.png" alt="logo"></a></p>');
eq("bullets", H("- a\n- b\n  - c\n  - d\n- e"), "<ul><li>a</li><li>b<ul><li>c</li><li>d</li></ul></li><li>e</li></ul>");
eq("ordered", H("3. a\n4. b"), '<ol start="3"><li>a</li><li>b</li></ol>');
eq("loose list", H("- a\n\n- b"), "<ul><li><p>a</p></li><li><p>b</p></li></ul>");
eq("tasks", H("- [ ] todo\n- [x] done"), '<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled> todo</li><li class="task-list-item"><input type="checkbox" disabled checked> done</li></ul>');
eq("list after paragraph", H("Intro:\n- a\n- b"), "<p>Intro:</p><ul><li>a</li><li>b</li></ul>");
eq("ordered can't interrupt unless 1", H("The year\n2026. was good"), "<p>The year\n2026. was good</p>");
eq("quote", H("> one\n> two\n>\n> three"), "<blockquote><p>one\ntwo</p><p>three</p></blockquote>");
eq("quote lazy", H("> one\ntwo"), "<blockquote><p>one\ntwo</p></blockquote>");
eq("nested quote", H("> a\n>> b"), "<blockquote><p>a</p><blockquote><p>b</p></blockquote></blockquote>");
eq("fenced code", H("```ts\nconst a = 1 < 2;\n```"), '<pre data-lang="ts"><code class="language-ts">const a = 1 &lt; 2;\n</code></pre>');
eq("tilde fence", H("~~~\n```\n~~~"), "<pre><code>```\n</code></pre>");
eq("indented code", H("    code\n      more"), "<pre><code>code\n  more\n</code></pre>");
eq("code in list", H("- a\n  ```js\n  x()\n  ```\n- b"), '<ul><li>a<pre data-lang="js"><code class="language-js">x()\n</code></pre></li><li>b</li></ul>');
eq("rule", H("a\n\n---\n\n***\n\nb"), "<p>a</p><hr><hr><p>b</p>");
eq("table", H("| Name | Qty |\n| :--- | ---: |\n| Tea | 2 |\n| A \\| B | 10 |"), '<table><thead><tr><th align="left">Name</th><th align="right">Qty</th></tr></thead><tbody><tr><td align="left">Tea</td><td align="right">2</td></tr><tr><td align="left">A | B</td><td align="right">10</td></tr></tbody></table>');
eq("entities", H("&copy; &amp; &#169; &bogus;"), "<p>© &amp; © &amp;bogus;</p>");

// ---------------------------------------------------------------------------------------------
// Safety

eq("raw html escaped", H("<script>alert(1)</script>"), "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
eq("html block escaped", H('<img src=x onerror="alert(1)">'), "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>");
eq("inline html escaped", H("a <b onclick=x>b</b>"), "<p>a &lt;b onclick=x&gt;b&lt;/b&gt;</p>");
eq("javascript link", H("[x](javascript:alert(1))"), "<p>x</p>");
eq("javascript link, mixed case and tab", H("[x](JaVa&#9;ScRipt:alert(1))"), "<p>x</p>");
eq("javascript autolink", H("<javascript:alert(1)>"), "<p>javascript:alert(1)</p>");
eq("vbscript", H("[x](vbscript:msgbox)"), "<p>x</p>");
eq("data html link", H("[x](data:text/html,<script>alert(1)</script>)"), "<p>x</p>");
eq("javascript image", H("![pic](javascript:alert(1))"), "<p>pic</p>");
eq("data svg image ok", H("![d](data:image/svg+xml;base64,PHN2Zz4=)"), '<p><img src="data:image/svg+xml;base64,PHN2Zz4=" alt="d"></p>');
eq("blob image ok", H("![d](blob:https://x.example/1234)"), '<p><img src="blob:https://x.example/1234" alt="d"></p>');
eq("attribute quotes", H('[a](https://x.example/"onmouseover="alert(1))'), '<p><a href="https://x.example/&quot;onmouseover=&quot;alert(1)">a</a></p>');
eq("title quotes", H('[a](/x "a&quot; onclick=&quot;y")'), '<p><a href="/x" title="a&quot; onclick=&quot;y">a</a></p>');
eq("safeUrl", [safeUrl("https://a.example"), safeUrl("/rel"), safeUrl("#top"), safeUrl("mailto:a@b.example"), safeUrl("ftp://x"), safeUrl(" javascript:x"), safeUrl("data:image/png;base64,AA"), safeUrl("data:text/plain,hi")], ["https://a.example", "/rel", "#top", "mailto:a@b.example", null, null, "data:image/png;base64,AA", null]);
eq("unsafe html in pasted html", fromHtml('<p>Hi <script>alert(1)</script><a href="javascript:alert(1)">there</a> <img src="javascript:x" alt="no"> <iframe src="https://evil.example"></iframe></p>'), "Hi there");
eq("styles dropped", fromHtml('<p style="color:red"><span style="color:blue;font-size:30px">Plain</span> <font color="red">text</font></p>'), "Plain text");

// ---------------------------------------------------------------------------------------------
// Markdown → tree → Markdown: what the serializer writes, and that it reads back the same

const canon = (md: string) => toMarkdown(parseMarkdown(md));
function roundTrip(name: string, md: string, want?: string) {
  const once = canon(md);
  if (want != null) eq(`${name}: written`, once, want);
  eq(`${name}: stable`, canon(once), once);
  eq(`${name}: same HTML`, H(once), H(md));
}

roundTrip("paragraphs", "One.\n\nTwo.", "One.\n\nTwo.");
roundTrip("emphasis", "*a* _b_ **c** __d__ ~~e~~", "*a* *b* **c** **d** ~~e~~");
roundTrip("nested emphasis", "***a*** **b *c* d** *e **f***");
roundTrip("headings", "# One\n\nSub\n---\n\n### Three #", "# One\n\n## Sub\n\n### Three");
roundTrip("escapes", "\\*not\\* 5 * 3 snake_case \\_x\\_ \\[x\\] a\\<b> \\&amp; ~~ok~~ \\~\\~no\\~\\~", "\\*not\\* 5 * 3 snake_case \\_x\\_ \\[x\\] a\\<b> \\&amp; ~~ok~~ \\~\\~no\\~\\~");
roundTrip("line starts", "\\# not heading\n\n\\- not list\n\n1\\. not list\n\n\\> not quote\n\n\\---");
roundTrip("code spans", "`a` `` b`c `` ` `d` `");
roundTrip("links", '[a](https://x.example "T") [b](<https://x.example/a b>) [c](/a_(b)) <https://x.example> <ana@x.example>', '[a](https://x.example "T") [b](<https://x.example/a b>) [c](</a_(b)>) <https://x.example> <ana@x.example>');
roundTrip("reference links become inline", "[a][r]\n\n[r]: /x", "[a](/x)");
roundTrip("images", '![A *harbour* at dusk](/h.svg "Dusk") ![](x.png)', '![A harbour at dusk](/h.svg "Dusk") ![](x.png)');
roundTrip("hard breaks", "one  \ntwo\\\nthree", "one\\\ntwo\\\nthree");
roundTrip("soft breaks kept", "one\ntwo", "one\ntwo");
roundTrip("bullets", "* a\n* b\n    * c\n+ d", "- a\n- b\n  - c\n\n* d");
roundTrip("ordered", "1) a\n2) b\n\n   c\n3) d", "1. a\n\n2. b\n\n   c\n\n3. d");
roundTrip("nested two levels", "- a\n  1. b\n     - [x] c\n  2. d\n- e", "- a\n  1. b\n     - [x] c\n  2. d\n- e");
roundTrip("tasks", "- [ ] one\n- [x] two\n- [ ]", "- [ ] one\n- [x] two\n- [ ]");
roundTrip("adjacent lists", "- a\n\n<!-- -->\n\n- b");
roundTrip("quote", "> a\n> > b\n>\n> - c", "> a\n>\n> > b\n>\n> - c");
roundTrip("code", "```ts\nconst x = 1;\n\n```\n\n~~~\n```\n~~~\n\n    indented", "```ts\nconst x = 1;\n\n```\n\n````\n```\n````\n\n```\nindented\n```");
roundTrip("empty code", "```\n```", "```\n```");
roundTrip("rules", "---\n\n- ---\n- ***", "---\n\n---\n\n- ***");
roundTrip("table", "| A | B |\n|:-:|--:|\n| 1 | x \\| y |\n| `c` | **d** |", "| A | B |\n| :---: | ---: |\n| 1 | x \\| y |\n| `c` | **d** |");
roundTrip("raw html stays text", "<b>bold?</b> & <i>", "\\<b>bold?\\</b> & \\<i>");
roundTrip("heading with hashes", "# C#\n\n## \\#\n\n### Ends with \\#", "# C#\n\n## \\#\n\n### Ends with \\#");
roundTrip("uploading image", "![Harbour](#uploading-u1)", "![Harbour](#uploading-u1)");

const LONG = `# Team handbook

Welcome to **Quire**. This is *how we work*, written down.

## Contents

1. [Hours](#hours)
2. [Leave](#leave)
   - Holidays
   - Sick days
3. Expenses

![The office at 4 Ropewalk Lane](/demos/editor/office.svg)

> **Note:** ask in #general when unsure.
> We'd rather you ask.

- [x] Read this page
- [ ] Set up your laptop

\`\`\`sh
npm run dev   # on :3000
\`\`\`

| Day | Hours |
| --- | ---: |
| Mon–Thu | 9–17 |
| Fri | 9–15 |

---

Questions? Mail <people@quire.example>.`;
roundTrip("long document", LONG);
roundTrip("kitchen sink", KITCHEN_SINK);
for (const d of DOCS) roundTrip(`demo document ${d.id}`, d.body);

// ---------------------------------------------------------------------------------------------
// HTML → Markdown

eq("editor paragraphs", fromHtml("<p>One <b>bold</b> and <i>it</i>, <strike>gone</strike>.</p><p><br></p><p>Two</p>"), "One **bold** and *it*, ~~gone~~.\n\nTwo");
eq("spaces move out of marks", fromHtml("<p>a<b> bold </b>word</p>"), "a **bold** word");
eq("adjacent marks merge", fromHtml("<p><b>bo</b><b>ld</b> <em>a</em><i>b</i></p>"), "**bold** *ab*");
eq("nested same marks", fromHtml("<p><b>a <strong>b</strong></b></p>"), "**a b**");
eq("google docs wrapper", fromHtml('<b style="font-weight:normal;" id="docs-internal-guid-1"><p><span style="font-weight:700">Bold</span> <span style="font-style:italic">it</span> <span style="text-decoration:line-through">x</span></p></b>'), "**Bold** *it* ~~x~~");
eq("whitespace collapses", fromHtml("<p>  a \n  b&nbsp;&nbsp;c  </p>"), "a b c");
eq("trailing br dropped", fromHtml("<p>text<br></p>"), "text");
eq("br is hard break", fromHtml("<p>one<br>two</p>"), "one\\\ntwo");
eq("double br splits", fromHtml("<div>one<br><br>two</div>"), "one\n\ntwo");
eq("divs are paragraphs", fromHtml("<div>a</div><div>b <div>c</div></div>"), "a\n\nb\n\nc");
eq("headings", fromHtml("<h1>A</h1><h2><br></h2><h3>B <br>C</h3><h6>F</h6>"), "# A\n\n### B C\n\n###### F");
eq("lists", fromHtml("<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul><ol start=\"2\"><li><p>d</p></li></ol>"), "- a\n- b\n  - c\n\n2. d");
eq("list in list (indent)", fromHtml("<ul><li>a</li><ul><li>b</li></ul><li>c</li></ul>"), "- a\n  - b\n- c");
eq("loose list from paragraphs", fromHtml("<ul><li><p>a</p><p>b</p></li><li>c</li></ul>"), "- a\n\n  b\n\n- c");
eq("editor task list", fromHtml('<ul class="contains-task-list"><li class="task-list-item" data-checked="true"><span contenteditable="false" data-task=""><input type="checkbox" checked></span>done</li><li class="task-list-item"><span contenteditable="false" data-task=""><input type="checkbox"></span>todo</li></ul>'), "- [x] done\n- [ ] todo");
eq("github task list", fromHtml('<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled checked> Ship it</li></ul>'), "- [x] Ship it");
eq("bare li", fromHtml("<li>a</li><li>b</li>"), "- a\n- b");
eq("pre with lang", fromHtml('<pre data-lang="js"><code>let a = 1;\n\nb();\n</code></pre>'), "```js\nlet a = 1;\n\nb();\n```");
eq("pre with class", fromHtml('<div class="highlight highlight-source-python"><pre>x = 1</pre></div>'), "```python\nx = 1\n```");
eq("pre with lines as divs", fromHtml('<pre><div>a</div><div><br></div><div>b</div></pre>'), "```\na\n\nb\n```");
eq("vs code paste", fromHtml('<div style="font-family: Menlo, monospace; white-space: pre;"><div><span style="color: #c586c0;">if</span> (x) {</div><div>  y();</div><div>}</div></div>'), "```\nif (x) {\n  y();\n}\n```");
eq("inline code", fromHtml("<p>Run <code>npm *i*</code> or <kbd>Ctrl</kbd></p>"), "Run `npm *i*` or `Ctrl`");
eq("links", fromHtml('<p><a href="https://x.example">site</a> <a href="https://x.example/a">https://x.example/a</a> <a>no href</a> <a href="#top">top</a></p>'), "[site](https://x.example) <https://x.example/a> no href [top](#top)");
eq("images", fromHtml('<p><img src="blob:https://x.example/1" alt="A [boat]"> <img data-src="#uploading-u2" src="blob:x" alt="up"></p>'), "![A \\[boat\\]](blob:https://x.example/1) ![up](#uploading-u2)");
eq("blockquote", fromHtml("<blockquote><p>a</p><p>b</p></blockquote>"), "> a\n>\n> b");
eq("hr", fromHtml("<p>a</p><hr><p>b</p>"), "a\n\n---\n\nb");
eq("table", fromHtml('<table><thead><tr><th>A</th><th style="text-align:right">B</th></tr></thead><tbody><tr><td>1|2</td><td><b>x</b></td></tr></tbody></table>'), "| A | B |\n| --- | ---: |\n| 1\\|2 | **x** |");
eq("text that looks like markup", fromHtml("<p># not a heading</p><p>- not a list</p><p>1. not a list</p><p>*stars* and _under_ and `tick` and [box]</p>"), "\\# not a heading\n\n\\- not a list\n\n1\\. not a list\n\n\\*stars\\* and \\_under\\_ and \\`tick\\` and \\[box\\]");
eq("zero-width spaces dropped", fromHtml("<p><code>\u200b</code>a\u200bb</p>"), "ab");
eq("empty", fromHtml("<p><br></p>"), "");

// The editor's own HTML reads back as the Markdown it came from, except that HTML has no soft
// line breaks: a paragraph's lines join into one
function joinLines(blocks: MdBlock[]): MdBlock[] {
  const inl = (n: MdInline[]): MdInline[] => n.map((x) => (x.type === "softbreak" ? { type: "text", value: " " } : "children" in x ? { ...x, children: inl(x.children) } : x));
  return blocks.map((b): MdBlock => {
    if (b.type === "paragraph" || b.type === "heading") return { ...b, children: inl(b.children) };
    if (b.type === "quote") return { ...b, children: joinLines(b.children) };
    if (b.type === "list") return { ...b, items: b.items.map((it) => ({ ...it, children: joinLines(it.children) })) };
    return b;
  });
}
function editable(name: string, md: string) {
  // Unsafe links are drawn as their text, so reading the HTML back loses them on purpose
  const want = canon(toMarkdown(joinLines(parseMarkdown(md)))).replace(/\[([^\]]*)\]\(<?javascript:[^)]*\)>?\)?/g, "$1");
  eq(`editable: ${name}`, fromHtml(markdownToHtml(md, { editable: true })), want);
  eq(`preview html: ${name}`, fromHtml(markdownToHtml(md)), want);
}
editable("long document", LONG);
editable("kitchen sink", KITCHEN_SINK);
editable("tasks", "- [ ] a\n- [x] b\n  - [ ] c");
editable("code", "```py\nprint('hi')\n\n```");
editable("breaks", "a\\\nb\nc");
editable("table", "| a | b |\n| --- | --- |\n| `x` |  |");

// ---------------------------------------------------------------------------------------------
// Text

eq("text", markdownToText("# Hi\n\nThe **quick** [fox](x) ![alt](y.png)\n\n- a\n- b"), "Hi\nThe quick fox \na\nb");
eq("words", countWords("It's a well-known fact: 3 cats, 2 dogs — and Zoë."), 10);

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
