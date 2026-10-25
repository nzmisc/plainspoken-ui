import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Prose } from "@/registry/plainspoken/ui/prose";

/*
 * Sample documents, written as the HTML a GFM renderer (remark-gfm + rehype, markdown-it, marked)
 * produces, with its class names and attributes, since that is what Prose has to style.
 */

const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240"><rect width="480" height="240" fill="#9cc3e6"/><circle cx="380" cy="60" r="28" fill="#f5d76e"/><path d="M0 170 L120 90 L220 160 L320 110 L480 170 V240 H0Z" fill="#5f8f5a"/></svg>`,
  );

function KitchenSinkDoc() {
  return (
    <>
      <h1>Heading 1</h1>
      <p>
        A paragraph with <em>emphasis</em>, <strong>strong</strong>, <strong><em>both</em></strong>, <del>strikethrough</del>,{" "}
        <code>inline code</code>, a <a href="https://commonmark.org">link</a>, a link with a{" "}
        <a href="https://github.github.com/gfm/" title="GitHub Flavored Markdown spec">
          title
        </a>
        , and an autolink: <a href="https://example.com/docs/getting-started">https://example.com/docs/getting-started</a>.
        Soft line breaks join lines;
        <br />a hard break starts a new line.
      </p>
      <h2>Heading 2</h2>
      <p>Text under a level-2 heading.</p>
      <h3>Heading 3</h3>
      <p>Text under a level-3 heading.</p>
      <h4>Heading 4</h4>
      <p>Text under a level-4 heading.</p>
      <h5>Heading 5</h5>
      <p>Text under a level-5 heading.</p>
      <h6>Heading 6</h6>
      <p>Text under a level-6 heading.</p>

      <h2>Lists</h2>
      <ul>
        <li>Unordered item</li>
        <li>
          Item with a nested list
          <ul>
            <li>
              Second level
              <ul>
                <li>Third level</li>
              </ul>
            </li>
            <li>Another second-level item</li>
          </ul>
        </li>
        <li>Last item</li>
      </ul>
      <ol>
        <li>First</li>
        <li>
          Second, with nested steps
          <ol>
            <li>
              Sub-step
              <ol>
                <li>Sub-sub-step</li>
              </ol>
            </li>
            <li>Another sub-step</li>
          </ol>
        </li>
        <li>Third</li>
      </ol>
      <ol start={7}>
        <li>A list that starts at 7</li>
        <li>Eight</li>
      </ol>
      <ul>
        <li>
          <p>A loose list item (blank lines between items wrap them in paragraphs).</p>
        </li>
        <li>
          <p>Second loose item, with two paragraphs.</p>
          <p>The second paragraph of the same item.</p>
        </li>
      </ul>

      <h3>Task list</h3>
      <ul className="contains-task-list">
        <li className="task-list-item">
          <input type="checkbox" disabled checked readOnly /> Registry published
        </li>
        <li className="task-list-item">
          <input type="checkbox" disabled checked readOnly /> Storybook published
        </li>
        <li className="task-list-item">
          <input type="checkbox" disabled readOnly /> Demos reviewed
          <ul className="contains-task-list">
            <li className="task-list-item">
              <input type="checkbox" disabled readOnly /> Mail
            </li>
            <li className="task-list-item">
              <input type="checkbox" disabled checked readOnly /> Blog
            </li>
          </ul>
        </li>
      </ul>

      <h2>Blockquotes</h2>
      <blockquote>
        <p>A blockquote. It can hold any other block, like a list:</p>
        <ul>
          <li>one</li>
          <li>two</li>
        </ul>
        <blockquote>
          <p>And a quote nested inside the quote.</p>
        </blockquote>
      </blockquote>

      <h3>GitHub alerts</h3>
      {(
        [
          ["note", "Note", "Useful information that users should know, even when skimming."],
          ["tip", "Tip", "Helpful advice for doing things better or more easily."],
          ["important", "Important", "Key information users need to know to achieve their goal."],
          ["warning", "Warning", "Urgent info that needs immediate user attention to avoid problems."],
          ["caution", "Caution", "Advises about risks or negative outcomes of certain actions."],
        ] as const
      ).map(([kind, title, text]) => (
        <div key={kind} className={`markdown-alert markdown-alert-${kind}`}>
          <p className="markdown-alert-title">{title}</p>
          <p>{text}</p>
        </div>
      ))}

      <h2>Code</h2>
      <p>A fenced block with a language (the renderer put data-lang on the pre):</p>
      <pre data-lang="ts">
        <code className="language-ts">{`export function usePoll<T>(url: string, intervalMs: number) {
  const [data, setData] = useState<T>();
  useEffect(() => {
    const id = setInterval(() => fetch(url).then((r) => r.json()).then(setData), intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs]);
  return data;
}`}</code>
      </pre>
      <p>An indented block (no language):</p>
      <pre>
        <code>{`$ systemctl --user status dashboard
● dashboard.service - team dashboard
     Active: active (running)`}</code>
      </pre>

      <h2>Table</h2>
      <p>
        Column alignment comes from the delimiter row (<code>:--</code>, <code>:-:</code>, <code>--:</code>). Headers stay
        left-aligned regardless.
      </p>
      <table>
        <thead>
          <tr>
            <th align="left">Mount</th>
            <th align="center">FS</th>
            <th align="right">Size</th>
            <th align="right">Used</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["/", "ext4", "290 GiB", "8%"],
            ["/boot", "ext4", "880 MiB", "27%"],
            ["/boot/efi", "vfat", "104 MiB", "6%"],
          ].map(([m, fs, size, used]) => (
            <tr key={m}>
              <td align="left">
                <code>{m}</code>
              </td>
              <td align="center">{fs}</td>
              <td align="right">{size}</td>
              <td align="right">{used}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Horizontal rule</h2>
      <p>Above the rule.</p>
      <hr />
      <p>Below the rule.</p>

      <h2>Images</h2>
      <p>
        An inline image with alt text: {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO} alt="Hills under a blue sky" width={48} height={24} /> and a broken one, which shows its alt text:{" "}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="./missing.png" alt="(missing image)" />
      </p>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO} alt="Hills under a blue sky, larger" width={480} height={240} />
        <figcaption>A figure with a caption (HTML in Markdown).</figcaption>
      </figure>

      <h2>Footnotes</h2>
      <p>
        The usage figure is account-wide
        <sup>
          <a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">
            1
          </a>
        </sup>{" "}
        and refreshed hourly
        <sup>
          <a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref aria-describedby="footnote-label">
            2
          </a>
        </sup>
        .
      </p>

      <h2>Inline HTML</h2>
      <p>
        Press <kbd>⌘</kbd> + <kbd>K</kbd>, or <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Del</kbd>. H<sub>2</sub>O, x<sup>2</sup>,{" "}
        <mark>highlighted</mark>, <abbr title="Server Message Block">SMB</abbr>, <ins>inserted</ins>, <small>small print</small>, and{" "}
        <samp>sample output</samp>.
      </p>
      <details>
        <summary>A collapsible section</summary>
        <p>
          Hidden until opened. It can contain <strong>any</strong> Markdown:
        </p>
        <ul>
          <li>lists</li>
          <li>
            <code>code</code>
          </li>
        </ul>
      </details>
      <details open>
        <summary>Open by default</summary>
        <p>This one starts open.</p>
      </details>
      <dl>
        <dt>Registry</dt>
        <dd>A list of components the shadcn CLI can copy into your project.</dd>
        <dt>Control height</dt>
        <dd>The fixed height every interactive control of one size shares: 20, 24, 28 or 36px.</dd>
      </dl>

      <section data-footnotes className="footnotes">
        <h2 className="sr-only" id="footnote-label">
          Footnotes
        </h2>
        <ol>
          <li id="user-content-fn-1">
            <p>
              <code>/api/v1/usage</code> covers every key on the account, not just this one.{" "}
              <a href="#user-content-fnref-1" data-footnote-backref aria-label="Back to reference 1">
                {"↩︎"}
              </a>
            </p>
          </li>
          <li id="user-content-fn-2">
            <p>
              From the <code>x-ratelimit-*</code> response headers.{" "}
              <a href="#user-content-fnref-2" data-footnote-backref aria-label="Back to reference 2">
                {"↩︎"}
              </a>
            </p>
          </li>
        </ol>
      </section>
    </>
  );
}

function ReadmeDoc() {
  return (
    <>
      <h1>plainspoken-ui</h1>
      <p>
        A React component library for pages that read like documents: <strong>plain HTML, made consistent</strong>. Square
        corners, real borders, blue links, and one height scale for every control.
      </p>
      <h2>Install</h2>
      <pre data-lang="sh">
        <code className="language-sh">{`npx shadcn@latest add https://plainspoken.dev/r/button.json`}</code>
      </pre>
      <p>
        Or add the registry to <code>components.json</code> and use <code>@plainspoken/button</code>.
      </p>
      <h2>Principles</h2>
      <ul>
        <li>
          <strong>Native first.</strong> <code>&lt;dialog&gt;</code> for modals, <code>&lt;details&gt;</code> for disclosure, the
          browser&apos;s own inputs.
        </li>
        <li>
          <strong>No dependencies.</strong> Every component is one file you own.
        </li>
        <li>
          <strong>Accessible.</strong> Each widget follows its ARIA Authoring Practices pattern.
        </li>
      </ul>
      <div className="markdown-alert markdown-alert-tip">
        <p className="markdown-alert-title">Tip</p>
        <p>
          Put <code>ctl-sm</code> on a toolbar and every control inside it becomes small.
        </p>
      </div>
      <h2>Sizes</h2>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th align="right">Height</th>
            <th>For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>xs</td>
            <td align="right">20px</td>
            <td>Inside running text and dense table rows</td>
          </tr>
          <tr>
            <td>sm</td>
            <td align="right">24px</td>
            <td>Toolbars, panel title bars, row actions</td>
          </tr>
          <tr>
            <td>md</td>
            <td align="right">28px</td>
            <td>The default: forms, dialogs, page headers</td>
          </tr>
          <tr>
            <td>lg</td>
            <td align="right">36px</td>
            <td>Touch screens, and a page&apos;s one big call to action</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function WideTableDoc() {
  const rows = [
    ["443", "https", "/", "proxy", "127.0.0.1:3773", "web serve --port 3773", "private", "Web front end and mobile app"],
    ["3389", "tcp", "", "tcp fwd", "127.0.0.1:3389", "xrdp", "private", "Remote desktop, shared session"],
    ["8443", "https", "/", "proxy", "127.0.0.1:49374", "editor serve --service", "private", "Code editor"],
    ["8444", "https", "/", "proxy", "127.0.0.1:8790", "node server/index.ts", "private", "This dashboard and its Storybook"],
  ];
  return (
    <>
      <p>A table wider than the column scrolls sideways on its own; the page doesn&apos;t.</p>
      <table>
        <thead>
          <tr>
            {["Port", "Proto", "Path", "Type", "Target", "Process", "Access", "What it is"].map((h) => (
              <th key={h} align={h === "Port" ? "right" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} align={i === 0 ? "right" : undefined}>
                  {i === 4 || i === 5 ? <code>{c}</code> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

const HTML = `<h2>From an HTML string</h2>
<p>Rendered by <code>marked</code> and passed as <code>html</code>. Note <code>style="text-align:right"</code> on the cells, which is what markdown-it writes.</p>
<table>
<thead><tr><th style="text-align:left">Plan</th><th style="text-align:right">Left</th></tr></thead>
<tbody>
<tr><td style="text-align:left">Requests (week)</td><td style="text-align:right">87%</td></tr>
<tr><td style="text-align:left">Credit</td><td style="text-align:right">$19.44</td></tr>
</tbody>
</table>
<pre><code class="language-python">print("hello from the server")
</code></pre>
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" disabled> unchecked</li>
<li class="task-list-item"><input type="checkbox" checked disabled> checked</li>
</ul>`;

const meta = {
  title: "Components/Typography/Prose",
  component: Prose,
  args: { size: "base", measure: true, tableCells: "wrap" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "base", "lg"] },
    tableCells: { control: "inline-radio", options: ["wrap", "nowrap"] },
    as: { control: false },
  },
} satisfies Meta<typeof Prose>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every element CommonMark and GFM produce, plus the inline HTML people use in Markdown. */
export const KitchenSink: Story = { render: (args) => <Prose {...args}><KitchenSinkDoc /></Prose> };

/** A README. */
export const Readme: Story = { render: (args) => <Prose {...args}><ReadmeDoc /></Prose> };

/** sm, base and lg: everything inside scales with the text size. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "base", "lg"] as const).map((s) => (
        <div key={s}>
          <p className="mb-1 font-mono text-[12px] text-muted-foreground">size=&quot;{s}&quot;</p>
          <Prose size={s}>
            <h2>Sizes</h2>
            <p>
              In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was
              upon the face of the deep. Press <kbd>Space</kbd> to read on, or see <a href="#genesis">Genesis 1</a>.
            </p>
            <pre data-lang="txt">
              <code>{"Genesis 1:1-2"}</code>
            </pre>
          </Prose>
        </div>
      ))}
    </div>
  ),
};

/** Renderer output as an HTML string, with inline text-align styles on the cells and a class="language-python" code block (labelled). */
export const FromHtmlString: Story = { render: (args) => <Prose {...args} html={HTML} /> };

/** Long code lines scroll inside the block; long inline values and URLs wrap. */
export const LongLines: Story = {
  render: (args) => (
    <Prose {...args}>
      <pre data-lang="json">
        <code>{`{"billingCycleStart":"1791780696000","billingCycleEnd":"1794459096000","planUsage":{"totalSpend":56,"includedSpend":56,"remaining":1944,"limit":2000}}`}</code>
      </pre>
      <p>
        A long inline value wraps instead: <code>x-ratelimit-unified-7d-utilization-percentage</code>,{" "}
        <a href="https://api.example.com/v1/organizations/acme/usage/current-period">https://api.example.com/v1/organizations/acme/usage/current-period</a>.
      </p>
    </Prose>
  ),
};

/** tableCells="nowrap": rows stay on one line and the table scrolls on its own. */
export const WideTable: Story = { args: { tableCells: "nowrap" }, render: (args) => <Prose {...args}><WideTableDoc /></Prose> };

/** At phone width (343px): the wide table wraps by default, or scrolls with tableCells="nowrap". */
export const PhoneWidth: Story = {
  render: () => (
    <div className="flex w-[343px] flex-col gap-4 border border-dashed border-border p-1">
      <Prose>
        <ReadmeDoc />
        <h3>Wide table, cells wrap (default)</h3>
        <WideTableDoc />
      </Prose>
      <Prose tableCells="nowrap">
        <h3>Wide table, tableCells=&quot;nowrap&quot;</h3>
        <WideTableDoc />
      </Prose>
    </div>
  ),
};

/** measure={false}: no line-length cap. */
export const FullWidth: Story = { args: { measure: false }, render: (args) => <Prose {...args}><ReadmeDoc /></Prose> };
