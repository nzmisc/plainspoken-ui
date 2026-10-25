import { BlogFigure, BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

/** [depth, start %, width %, name]: a request handler's CPU profile, one row per stack depth */
const FRAMES: [number, number, number, string][] = [
  [0, 0, 100, "http.(*conn).serve"],
  [1, 0, 100, "api.(*Server).ServeHTTP"],
  [2, 0, 22, "auth.Check"],
  [2, 22, 66, "orders.List"],
  [2, 88, 12, "json.Marshal"],
  [3, 0, 18, "jwt.Parse"],
  [3, 22, 40, "db.(*Conn).Query"],
  [3, 62, 24, "orders.applyDiscounts"],
  [3, 88, 11, "reflect.Value.Field"],
  [4, 0, 15, "rsa.VerifyPKCS1v15"],
  [4, 22, 9, "pgx.(*Conn).Exec"],
  [4, 31, 29, "pgx.readRows"],
  [4, 62, 21, "money.Round"],
  [5, 31, 25, "pgtype.Decode"],
  [5, 62, 19, "big.(*Float).Quo"],
];

function FlameGraph() {
  const W = 620;
  const H = 22;
  const rows = 6;
  return (
    <svg viewBox={`0 0 ${W + 20} ${rows * H + 34}`} className="h-auto w-full min-w-[520px]" role="img" aria-labelledby="flame-title">
      <title id="flame-title">
        A flame graph of one request handler. The widest children of the handler are orders.List at 66% of the time, auth.Check at
        22% and json.Marshal at 12%. Inside orders.List, money.Round takes 21% of all samples.
      </title>
      <g fontSize="11" fontFamily="var(--font-mono)">
        {FRAMES.map(([depth, start, width, name]) => {
          const x = 10 + (start / 100) * W;
          const w = (width / 100) * W;
          const y = 10 + (rows - 1 - depth) * H;
          const hot = name === "money.Round" || name === "big.(*Float).Quo";
          return (
            <g key={`${depth}-${name}`}>
              <rect
                x={x}
                y={y}
                width={w - 1}
                height={H - 2}
                fill="var(--color-chart-2)"
                fillOpacity={hot ? 0.55 : 0.18 + depth * 0.04}
                stroke={hot ? "var(--color-foreground)" : "none"}
                strokeWidth={hot ? 1 : 0}
              />
              {w > 60 && (
                <text x={x + 5} y={y + 14} fill="var(--color-foreground)">
                  {name.length * 6.6 > w - 10 ? name.slice(0, Math.floor((w - 16) / 6.6)) + "…" : name}
                </text>
              )}
            </g>
          );
        })}
      </g>
      <g fontSize="12" fontFamily="var(--font-sans)" fill="var(--color-muted-foreground)">
        <text x="10" y={rows * H + 28}>
          0%
        </text>
        <text x={W + 10} y={rows * H + 28} textAnchor="end">
          100% of samples (not time order)
        </text>
      </g>
    </svg>
  );
}

export const post: Post = {
  slug: "flame-graphs",
  title: "Reading flame graphs without lying to yourself",
  date: "2025-11-07",
  summary: "Width is time, not calls, and left to right means nothing. Five traps I fell into while chasing a 40 ms regression.",
  tags: ["performance"],
  minutes: 3,
  body: () => ({
    intro: (
      <>
        <p>
          In October our order-listing endpoint got 40 milliseconds slower at the 95th percentile, and it took me a week
          to find out why. The profile had the answer on day one. I just kept reading it wrong. Here are the five ways I
          misread a flame graph, so you can skip them.
        </p>
        <BlogFigure caption="A CPU flame graph of the handler, simplified. Each box is a function; the boxes above it are what it called. The outlined boxes are the regression.">
          <FlameGraph />
        </BlogFigure>
      </>
    ),
    sections: [
      {
        id: "width-is-time",
        title: "1. Width is time, not calls",
        body: (
          <p>
            A box&rsquo;s width is the share of samples in which that function was on the stack. A function called once
            that runs for a long time is wide; a function called a million times that returns at once can be invisible.
            I spent a day optimising <code>reflect.Value.Field</code> because I knew it was called on every field of
            every order. It was 11% of the samples. The fix saved 11% of a small number.
          </p>
        ),
      },
      {
        id: "left-to-right",
        title: "2. Left to right means nothing",
        body: (
          <p>
            Boxes on one row are sorted alphabetically, or by however the tool merged the stacks. They are not in the
            order things happened. <code>auth.Check</code> is on the left because it starts with an &ldquo;a&rdquo;, not
            because authentication happens first (although it does). If you want order in time, you want a trace, not a
            profile.
          </p>
        ),
      },
      {
        id: "self-time",
        title: "3. Look for plateaus, not towers",
        body: (
          <p>
            A tall narrow tower is a deep call stack, which is usually just how the code is organised. What matters is a
            wide box with nothing on top of it: time spent in the function itself. In our graph that was{" "}
            <code>big.(*Float).Quo</code>, sitting on <code>money.Round</code>. Someone had changed discount rounding to
            use arbitrary-precision decimals, for every line of every order, on every list request.
          </p>
        ),
      },
      {
        id: "cpu-is-not-wall",
        title: "4. A CPU profile doesn't see waiting",
        body: (
          <>
            <p>
              The database call is 40% of the CPU samples here, but in wall-clock time it was far more: a CPU profile only
              samples while the code is running, and a request waiting on the network isn&rsquo;t running. For the
              regression this didn&rsquo;t matter, since it was pure computation. For most slow endpoints it is the whole
              story, and an off-CPU profile or a trace is the tool.
              <BlogFootnoteRef n={1} />
            </p>
          </>
        ),
      },
      {
        id: "compare",
        title: "5. Compare two graphs, not one",
        body: (
          <>
            <p>
              A single profile tells you where the time goes, not what changed. What finally found the bug was a
              differential flame graph: the same endpoint before and after the deploy, with boxes coloured by how much
              they grew. <code>money.Round</code> lit up and nothing else did.
            </p>
            <blockquote>
              <p>A profile answers &ldquo;where does the time go?&rdquo;. A regression asks &ldquo;what changed?&rdquo;. Ask the right one.</p>
            </blockquote>
            <p>
              The fix was to round once per order instead of once per line, which is also what the accountants had asked
              for in the first place.
            </p>
          </>
        ),
      },
    ],
    footnotes: [
      <>
        In Go, the execution tracer (<code>go tool trace</code>) shows goroutines blocked on the network; on Linux in
        general, <code>offcputime</code> from the BCC tools does the same for any process.
      </>,
    ],
  }),
};
