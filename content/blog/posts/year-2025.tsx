import type { Post } from "../types";

export const post: Post = {
  slug: "year-2025",
  title: "2025 in review",
  date: "2025-12-30",
  summary: "A new team at work, one conference talk, eleven posts published out of thirty-four started, and a lot of kilometres on a bike.",
  tags: ["personal"],
  minutes: 2,
  body: () => ({
    intro: (
      <p>
        I write one of these every year, mostly for myself: it is the only way I remember what happened in March. If you
        are here for databases, the next post is about flame graphs, and this one can safely be skipped.
      </p>
    ),
    sections: [
      {
        id: "work",
        title: "Work",
        body: (
          <p>
            In January I moved from the order pipeline to the platform team at Northwind Freight, which now means four
            people looking after the databases, CI and the deploy tooling for sixty engineers. The biggest change was
            from writing code that runs to writing code that other people run. The thing I am proudest of is boring: we
            deleted 70% of our paging alerts, and nobody missed any of them.
          </p>
        ),
      },
      {
        id: "in-numbers",
        title: "In numbers",
        body: (
          <table>
            <thead>
              <tr>
                <th>What</th>
                <th>2024</th>
                <th>2025</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Posts published</td>
                <td align="right">9</td>
                <td align="right">11</td>
              </tr>
              <tr>
                <td>Drafts abandoned</td>
                <td align="right">32</td>
                <td align="right">23</td>
              </tr>
              <tr>
                <td>Times I was paged</td>
                <td align="right">41</td>
                <td align="right">12</td>
              </tr>
              <tr>
                <td>Books finished</td>
                <td align="right">14</td>
                <td align="right">17</td>
              </tr>
              <tr>
                <td>Kilometres cycled</td>
                <td align="right">2,900</td>
                <td align="right">4,350</td>
              </tr>
            </tbody>
          </table>
        ),
      },
      {
        id: "talk",
        title: "The talk",
        body: (
          <p>
            In October I gave my first conference talk, a lightning talk on draining Postgres primaries. Five minutes
            took me about thirty hours to prepare, most of it cutting. I was sure I would forget everything and instead
            finished twenty seconds early. Two people came to ask questions afterwards, and one of them sent a patch to
            pgdrain the next week, which is the best review a talk can get.
          </p>
        ),
      },
      {
        id: "reading",
        title: "Reading",
        body: (
          <>
            <p>The three books from this year I keep recommending:</p>
            <ul>
              <li>
                <cite>How Buildings Learn</cite>, Stewart Brand. Software architecture, without the software. I will write
                about it properly next year.
              </li>
              <li>
                <cite>The Checklist Manifesto</cite>, Atul Gawande. Why surgeons and pilots use checklists, and what runbooks
                should borrow.
              </li>
              <li>
                <cite>Slow Productivity</cite>, Cal Newport. Fewer things, at a natural pace, done properly.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "next-year",
        title: "Next year",
        body: (
          <>
            <p>Three intentions, deliberately small:</p>
            <ol>
              <li>Publish pgdrain 1.0, with documentation good enough that I stop answering the same three emails.</li>
              <li>Write shorter posts, more often. One a month is the goal.</li>
              <li>Ride the Parenzana, finally, after three years of saying so.</li>
            </ol>
          </>
        ),
      },
    ],
  }),
};
