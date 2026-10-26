import { BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "how-buildings-learn",
  title: "How Buildings Learn, for people who build software",
  date: "2026-08-30",
  summary:
    "Stewart Brand's 1994 book about what happens to buildings after they're built is the best book on software architecture I've read, and it never mentions software.",
  tags: ["books", "architecture"],
  minutes: 4,
  body: () => ({
    intro: (
      <>
        <p>
          <cite>How Buildings Learn: What Happens After They&rsquo;re Built</cite> is a book about houses, offices, barns
          and laboratories, and how the people inside them change them over decades. It came out in 1994, it is full of
          photographs of the same building taken fifty years apart, and I have now read it twice. The second time I read
          it with a pencil, and almost every margin note says something about software.
        </p>
        <p>
          This isn&rsquo;t a review so much as a list of the ideas I keep borrowing. Read the book; it is better than my
          summary and much better illustrated.
        </p>
      </>
    ),
    sections: [
      {
        id: "shearing-layers",
        title: "Shearing layers",
        body: (
          <>
            <p>
              The idea the book is known for: a building isn&rsquo;t one thing but several layers that change at different
              speeds. Brand, building on the architect Frank Duffy, names six: the <em>site</em>, which outlives
              everything; the <em>structure</em>, which lasts decades or centuries; the <em>skin</em>, re-clad every twenty
              years or so; the <em>services</em> (wiring, plumbing, heating) that wear out in seven to fifteen; the{" "}
              <em>space plan</em> of walls and doors, which a busy office moves every few years; and the <em>stuff</em>,
              the furniture, which moves daily.
            </p>
            <p>
              A building works when the fast layers can change without disturbing the slow ones. It fails when they are
              tangled: when the wiring is cast into the concrete, re-wiring means demolition. I have worked on that
              codebase. So, I suspect, have you.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Building layer</th>
                  <th>Changes every</th>
                  <th>In a web application, roughly</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Site</td>
                  <td>never</td>
                  <td>The problem domain and its laws: money, time, people</td>
                </tr>
                <tr>
                  <td>Structure</td>
                  <td>decades</td>
                  <td>The data model and the database</td>
                </tr>
                <tr>
                  <td>Skin</td>
                  <td>~20 years</td>
                  <td>Public APIs and URLs</td>
                </tr>
                <tr>
                  <td>Services</td>
                  <td>7–15 years</td>
                  <td>Runtime, framework, infrastructure</td>
                </tr>
                <tr>
                  <td>Space plan</td>
                  <td>3–30 years</td>
                  <td>Modules, services and who owns them</td>
                </tr>
                <tr>
                  <td>Stuff</td>
                  <td>daily</td>
                  <td>Features, copy, configuration</td>
                </tr>
              </tbody>
            </table>
            <p>
              The mapping is loose, and Brand would hate me for the table. But it explains why the migrations I dread are
              always the slow layers (the schema, the URL structure) and why rewrites that promise to fix the stuff by
              replacing the structure so rarely pay off.
            </p>
          </>
        ),
      },
      {
        id: "low-road",
        title: "The low road",
        body: (
          <>
            <p>
              Brand&rsquo;s favourite buildings are what he calls &ldquo;low road&rdquo;: cheap, plain, and nobody
              cares much if you knock a hole in the wall. Garages, warehouses, old industrial lofts. His great example is
              Building 20 at MIT, a temporary wooden structure thrown up during the war that housed some of the most
              productive research groups of the century, precisely because nobody needed permission to change it.
            </p>
            <p>
              The software equivalent is the boring internal tool with no design system, owned by a team that lets you
              send a pull request. It is ugly and it is where things get done. The opposite, which Brand calls
              &ldquo;magazine architecture&rdquo;, is the building designed to be photographed on its opening day. We have
              those too. They demo very well.
              <BlogFootnoteRef n={1} />
            </p>
          </>
        ),
      },
      {
        id: "predictions",
        title: "All buildings are predictions",
        body: (
          <>
            <blockquote>
              <p>All buildings are predictions. All predictions are wrong.</p>
            </blockquote>
            <p>
              That is the book&rsquo;s most quoted line, and its answer is not to predict better but to plan for being
              wrong: leave room, use materials that forgive, make the layers separable, and prefer the design that
              survives several futures over the one that is perfect for the most likely one. Brand calls this
              scenario planning, borrowed from Shell&rsquo;s oil-price planners.
            </p>
            <p>
              In practice, for me, it has meant three habits. Keep the schema boring and add to it rather than reshaping
              it. Keep URLs forever, with redirects. And when I don&rsquo;t know which way something will grow, build the
              cheapest version that doesn&rsquo;t block either way, and write down what would make me change it.
            </p>
          </>
        ),
      },
      {
        id: "read-it",
        title: "Should you read it?",
        body: (
          <p>
            Yes, and get the paper edition: half the argument is in the photographs, and they are small on a screen. Skip
            the chapter on preservation if you are short of time. Don&rsquo;t skip the one on vernacular buildings, which
            is about how ordinary builders got good results by copying what already worked nearby, and which is the best
            argument for boring technology I know.
          </p>
        ),
      },
    ],
    footnotes: [
      <>
        The problem isn&rsquo;t beauty. It is when the opening-day photograph becomes the goal: a system that looks
        exactly like its launch screenshot five years later has stopped learning, or nobody uses it.
      </>,
    ],
  }),
};
