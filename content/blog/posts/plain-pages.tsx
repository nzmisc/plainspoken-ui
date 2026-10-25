import { BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "plain-pages",
  title: "Plain pages, on purpose",
  date: "2026-07-03",
  summary:
    "This site is a few kilobytes of HTML and one stylesheet. Not out of nostalgia: every rule here exists because something else broke for a reader.",
  tags: ["web", "design"],
  minutes: 3,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          Every couple of years I rebuild this site, and every time it gets smaller. The current version is server-rendered
          HTML, one stylesheet, and no script you need in order to read anything. People sometimes ask whether that is a
          statement. It isn&rsquo;t. It is a list of fixes, each for a problem a reader actually had.
        </p>
      </>
    ),
    sections: [
      {
        id: "the-rules",
        title: "The rules",
        body: (
          <ol>
            <li>
              <strong>The text arrives with the page.</strong> A post is in the HTML the server sends, so it shows up on a
              train with one bar of signal, in a feed reader, in a read-later app, and for a search engine that
              doesn&rsquo;t run scripts.
            </li>
            <li>
              <strong>Links look like links.</strong> Blue, underlined, purple once visited. Readers use the colour to see
              which posts they have already read, and I have had emails asking me never to change it.
            </li>
            <li>
              <strong>Lines stop at about 75 characters.</strong> Longer lines are tiring to read, and nobody has ever
              asked for wider text.
            </li>
            <li>
              <strong>Light and dark follow the system.</strong> One media query, no toggle to forget.
            </li>
            <li>
              <strong>Headings are a table of contents.</strong> One h1, then h2s that make sense out of context, because
              screen-reader users jump between them the way sighted readers skim.
            </li>
          </ol>
        ),
      },
      {
        id: "the-budget",
        title: "The budget",
        body: (
          <>
            <p>
              I keep a budget for a typical post, measured compressed, as the browser downloads it. Going over means
              something has to go.
            </p>
            <table>
              <thead>
                <tr>
                  <th>What</th>
                  <th>Budget</th>
                  <th>Today</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>HTML of a long post</td>
                  <td align="right">20 KB</td>
                  <td align="right">9 KB</td>
                </tr>
                <tr>
                  <td>CSS, the whole site</td>
                  <td align="right">10 KB</td>
                  <td align="right">4 KB</td>
                </tr>
                <tr>
                  <td>Fonts</td>
                  <td align="right">60 KB</td>
                  <td align="right">0 KB</td>
                </tr>
                <tr>
                  <td>Script needed to read</td>
                  <td align="right">0 KB</td>
                  <td align="right">0 KB</td>
                </tr>
              </tbody>
            </table>
            <p>
              The fonts line is zero because the site uses the reader&rsquo;s own sans-serif. I tried a web font for a
              year; nobody noticed when I took it out, and the text stopped jumping when the font arrived.
            </p>
          </>
        ),
      },
      {
        id: "the-stylesheet",
        title: "Most of the stylesheet",
        body: (
          <>
            <p>The parts that do the real work fit on one screen:</p>
            <Code lang="css" title="site.css">{`:root {
  color-scheme: light dark;
  --text: #1a1a1a;
  --bg: #ffffff;
  --link: #0000ee;
  --visited: #551a8b;
}
@media (prefers-color-scheme: dark) {
  :root { --text: #e6e6e6; --bg: #121212; --link: #8ab4f8; --visited: #c58af9; }
}
body {
  max-width: 75ch;
  margin: 0 auto;
  padding: 1rem;
  font: 17px/1.6 system-ui, sans-serif;
  color: var(--text);
  background: var(--bg);
}
a { color: var(--link); }
a:visited { color: var(--visited); }
pre { overflow-x: auto; }
img { max-width: 100%; height: auto; }`}</Code>
            <p>
              The rest is tables, code blocks and footnotes, and it is about as long again.
              <BlogFootnoteRef n={1} />
            </p>
          </>
        ),
      },
      {
        id: "what-it-costs",
        title: "What it costs",
        body: (
          <>
            <p>
              Some things are harder. There is no comment section, so replies come by email (and are better for it). There
              is no live search; the archive is one page and the browser&rsquo;s find works on it. Syntax highlighting
              happens when the site is built, not in the reader&rsquo;s browser.
            </p>
            <blockquote>
              <p>
                The question I ask before adding anything: what would a well-made page from 2005 have done here, and is
                the reader better off with something else?
              </p>
            </blockquote>
            <p>Usually the answer is no, and the page stays plain.</p>
          </>
        ),
      },
    ],
    footnotes: [
      <>
        The colours in the snippet are the browsers&rsquo; own defaults for links, which is the point: readers already
        know what they mean.
      </>,
    ],
  }),
};
