import { KITCHEN_SINK } from "@/registry/plainspoken/blocks/editor/data";
import { markdownToHtml } from "@/registry/plainspoken/lib/markdown";
import { Prose } from "@/registry/plainspoken/ui/prose";

/**
 * Every element Prose styles. First a Markdown text with everything Markdown can say, rendered by
 * the markdown item's renderer (safe for untrusted text: the raw HTML in it shows as text). Then
 * the HTML that people put in Markdown and that renderer plugins write, which Prose styles too:
 * keys, marks, abbreviations, sub- and superscript, figures, definition lists, details, GitHub's
 * alerts and footnotes.
 */
export default function ProseKitchenSink() {
  return (
    <div className="flex flex-col gap-8">
      <Prose html={markdownToHtml(KITCHEN_SINK)} />
      <Prose>
        <h2>Beyond Markdown</h2>
        <p>
          Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search. Text can be <mark>marked</mark>, an <abbr title="Comma-separated values">CSV</abbr> abbreviation
          explains itself on hover, water is H<sub>2</sub>O and a kilobyte is 10<sup>3</sup> bytes. <small>Small print stays readable.</small>
        </p>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- a plain picture in running text, as Markdown makes */}
          <img src="/demos/editor/map.svg" alt="Map: the studio at 4 Ropewalk Lane, two streets from Harbour Station" width={640} height={320} />
          <figcaption>The studio, two streets from Harbour Station. A figure with its caption.</figcaption>
        </figure>
        <dl>
          <dt>Draft</dt>
          <dd>Only the people who can edit the handbook see it.</dd>
          <dt>Published</dt>
          <dd>Everyone at the studio sees it, and it shows up in search.</dd>
        </dl>
        <details>
          <summary>Why the handbook is in Markdown</summary>
          <p>It reads well as plain text, diffs well, and outlives every editor we have used.</p>
        </details>
        <div className="markdown-alert markdown-alert-note">
          <p className="markdown-alert-title">Note</p>
          <p>The handbook is for everyone at the studio; fix what is wrong.</p>
        </div>
        <div className="markdown-alert markdown-alert-tip">
          <p className="markdown-alert-title">Tip</p>
          <p>Type &ldquo;## &rdquo; at the start of a line for a heading.</p>
        </div>
        <div className="markdown-alert markdown-alert-important">
          <p className="markdown-alert-title">Important</p>
          <p>Expenses go in by the 25th.</p>
        </div>
        <div className="markdown-alert markdown-alert-warning">
          <p className="markdown-alert-title">Warning</p>
          <p>The alarm code changes on the first of the month.</p>
        </div>
        <div className="markdown-alert markdown-alert-caution">
          <p className="markdown-alert-title">Caution</p>
          <p>Deleting a page can&apos;t be undone.</p>
        </div>
        <p>
          A claim that needs a source.
          <sup>
            <a href="#sink-fn-1" id="sink-fnref-1" data-footnote-ref>
              1
            </a>
          </sup>
        </p>
        <section data-footnotes>
          <h2 className="sr-only">Footnotes</h2>
          <ol>
            <li id="sink-fn-1">
              <p>
                The source, as a footnote at the foot of the text. <a href="#sink-fnref-1">Back to the text</a>
              </p>
            </li>
          </ol>
        </section>
      </Prose>
    </div>
  );
}
