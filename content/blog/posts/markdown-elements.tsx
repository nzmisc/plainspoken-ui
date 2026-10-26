import { BlogFigure, BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "markdown-elements",
  title: "Every Markdown element, styled",
  date: "2026-10-20",
  summary:
    "The page I check every stylesheet change against: each thing a post can contain, once, from bold text to footnotes. If it looks right here, it looks right everywhere.",
  tags: ["web", "design"],
  minutes: 4,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          Every time I touch this site&rsquo;s stylesheet I open one page and scroll through it. It has everything a post can
          contain, each thing once, so a change that breaks lists or makes code blocks too wide shows up straight away. It
          started as a private test page; it may as well be a post. If you write Markdown, this is also what each piece of
          it turns into here.
        </p>
      </>
    ),
    sections: [
      {
        id: "text",
        title: "Text",
        body: (
          <>
            <p>
              A paragraph has <strong>bold</strong>, <em>italic</em> and <strong>
                <em>both</em>
              </strong>
              , <del>struck-out text</del>, <code>inline code</code> and <a href="https://example.com/style">a link</a>, which
              turns purple once you&rsquo;ve visited it. Keys look like keys: <kbd>Ctrl</kbd> + <kbd>C</kbd>. Text can be{" "}
              <mark>marked</mark>, an abbreviation like <abbr title="Write-ahead log">WAL</abbr> explains itself on hover, water
              is H<sub>2</sub>O and a megabyte is 10<sup>6</sup> bytes.
            </p>
            <p>
              A line can end early,
              <br />
              like this, when the words need it: addresses, poems, the odd signature.
            </p>
          </>
        ),
      },
      {
        id: "headings",
        title: "Headings",
        body: (
          <p>
            A post has one title, then second-level headings like the ones on this page; they make the table of contents. The
            levels below them get smaller, and the last one is grey.
          </p>
        ),
      },
      {
        id: "third-level",
        title: "A third-level heading",
        level: 3,
        body: (
          <>
            <p>For a part of a section. Below it, rarely needed:</p>
            <h4>A fourth-level heading</h4>
            <h5>A fifth-level heading</h5>
            <h6>A sixth-level heading</h6>
          </>
        ),
      },
      {
        id: "lists",
        title: "Lists",
        body: (
          <>
            <p>Bullets, nested; each level gets its own marker:</p>
            <ul>
              <li>Coffee</li>
              <li>
                Tea
                <ul>
                  <li>
                    Green
                    <ul>
                      <li>Sencha</li>
                      <li>Gyokuro</li>
                    </ul>
                  </li>
                  <li>Black</li>
                </ul>
              </li>
              <li>Water</li>
            </ul>
            <p>Numbered, starting where it needs to:</p>
            <ol start={3}>
              <li>Stop the writes</li>
              <li>
                Wait for the replica
                <ol>
                  <li>Check the lag</li>
                  <li>Check it again</li>
                </ol>
              </li>
              <li>Switch over</li>
            </ol>
            <p>A task list, with a plain item among the tasks (it keeps its bullet):</p>
            <ul className="contains-task-list">
              <li className="task-list-item">
                <input type="checkbox" disabled checked readOnly /> Write the post
              </li>
              <li className="task-list-item">
                <input type="checkbox" disabled readOnly /> Check it on a phone
              </li>
              <li>Ask someone to read it</li>
            </ul>
            <p>And a definition list, for terms:</p>
            <dl>
              <dt>Primary</dt>
              <dd>The database that takes the writes.</dd>
              <dt>Replica</dt>
              <dd>A copy that follows it and answers reads.</dd>
            </dl>
          </>
        ),
      },
      {
        id: "quotes",
        title: "Quotes",
        body: (
          <blockquote>
            <p>A quote is set in, with a line beside it, and can hold other quotes:</p>
            <blockquote>
              <p>All buildings are predictions. All predictions are wrong.</p>
            </blockquote>
            <p>Stewart Brand, in How Buildings Learn</p>
          </blockquote>
        ),
      },
      {
        id: "code",
        title: "Code",
        body: (
          <>
            <p>Code blocks scroll sideways rather than wrap, and say what language they are in:</p>
            <Code lang="ts" title="word-count.ts">{`export function wordCount(text: string): number {
  // Runs of letters and digits, apostrophes and hyphens inside them
  return text.match(/[\\p{L}\\p{N}](?:[\\p{L}\\p{N}'-]*[\\p{L}\\p{N}])?/gu)?.length ?? 0;
}`}</Code>
            <Code lang="sh">{`journalctl --user -u backup.service --since today | tail -n 20`}</Code>
          </>
        ),
      },
      {
        id: "tables",
        title: "Tables",
        body: (
          <>
            <p>Numbers line up on the right; headers stay on the left:</p>
            <table>
              <thead>
                <tr>
                  <th>Element</th>
                  <th>Times on this site</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Code block</td>
                  <td align="right">64</td>
                  <td align="right">2019</td>
                </tr>
                <tr>
                  <td>Table</td>
                  <td align="right">17</td>
                  <td align="right">2020</td>
                </tr>
                <tr>
                  <td>Footnote</td>
                  <td align="right">9</td>
                  <td align="right">2023</td>
                </tr>
              </tbody>
            </table>
          </>
        ),
      },
      {
        id: "pictures",
        title: "Pictures",
        body: (
          <>
            <BlogFigure caption="A test card: colour bars and a grey scale. A picture keeps its size up to the column's width, with its caption under it.">
              {/* eslint-disable-next-line @next/next/no-img-element -- a plain picture in running text, as Markdown makes */}
              <img src="/demos/blog/test-card.svg" alt="A television test card: colour bars, a grey scale and a circle with a cross in the middle" width={640} height={360} />
            </BlogFigure>
            <p>
              Every picture has alt text, which is what a screen reader says instead of showing it, and what you see when it
              doesn&rsquo;t load.
            </p>
          </>
        ),
      },
      {
        id: "asides",
        title: "Asides",
        body: (
          <>
            <details>
              <summary>Details that most readers can skip</summary>
              <p>Open and close with a click or the keyboard; no script involved.</p>
            </details>
            <div className="markdown-alert markdown-alert-note">
              <p className="markdown-alert-title">Note</p>
              <p>Something worth knowing, even when skimming.</p>
            </div>
            <div className="markdown-alert markdown-alert-tip">
              <p className="markdown-alert-title">Tip</p>
              <p>A better way to do the thing.</p>
            </div>
            <div className="markdown-alert markdown-alert-important">
              <p className="markdown-alert-title">Important</p>
              <p>Something you need to know to succeed.</p>
            </div>
            <div className="markdown-alert markdown-alert-warning">
              <p className="markdown-alert-title">Warning</p>
              <p>Something that needs attention right away.</p>
            </div>
            <div className="markdown-alert markdown-alert-caution">
              <p className="markdown-alert-title">Caution</p>
              <p>What happens if you do it anyway.</p>
            </div>
          </>
        ),
      },
      {
        id: "the-rest",
        title: "Rules and footnotes",
        body: (
          <>
            <p>A rule ends one part of a text before the next:</p>
            <hr />
            <p>
              And a claim that needs a source gets a number, which leads to a note at the bottom.
              <BlogFootnoteRef n={1} />
            </p>
          </>
        ),
      },
    ],
    footnotes: [
      <>
        Like this one. The link at its end goes back to where you were reading.
      </>,
    ],
  }),
};
