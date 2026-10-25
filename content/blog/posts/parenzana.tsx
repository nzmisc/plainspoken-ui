import { BlogFigure, BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

/** Height above sea level along the route, from the bike computer, smoothed to one point every few km. */
const PROFILE: [km: number, m: number][] = [
  [0, 4], [8, 12], [16, 6], [22, 18], [30, 8], [36, 34], [42, 22], [48, 40], [56, 95], [62, 180], [66, 215],
  [72, 262], [76, 290], [80, 248], [86, 160], [91, 62], [95, 18], [99, 60], [104, 150], [108, 205], [112, 168],
  [118, 82], [123, 6],
];
const TOWNS: [km: number, name: string][] = [
  [0, "Trieste"], [30, "Izola"], [62, "Buje"], [76, "Grožnjan"], [95, "Livade"], [123, "Poreč"],
];

function ElevationProfile() {
  const x = (km: number) => 44 + (km / 123) * 580;
  const y = (m: number) => 170 - (m / 320) * 150;
  const line = PROFILE.map(([km, m]) => `${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 640 214" className="h-auto w-full min-w-[480px]" role="img" aria-labelledby="profile-title">
      <title id="profile-title">
        Elevation along the Parenzana: flat along the coast to Izola, a long climb to about 290 metres near Grožnjan, down
        to the river at Livade, up again to about 200 metres, and down to the sea at Poreč.
      </title>
      <g stroke="var(--color-border)">
        <line x1="44" y1="20" x2="44" y2="170" />
        <line x1="44" y1="170" x2="624" y2="170" />
        {[100, 200, 300].map((m) => (
          <line key={m} x1="44" y1={y(m)} x2="624" y2={y(m)} strokeDasharray="2 4" />
        ))}
      </g>
      <polygon points={`44,170 ${line} 624,170`} fill="var(--color-chart-3)" opacity="0.18" />
      <polyline points={line} fill="none" stroke="var(--color-chart-3)" strokeWidth="2" strokeLinejoin="round" />
      <g fill="var(--color-muted-foreground)" fontSize="12" fontFamily="var(--font-sans)">
        {[0, 100, 200, 300].map((m) => (
          <text key={m} x="38" y={y(m) + 4} textAnchor="end">
            {m === 300 ? "300 m" : m}
          </text>
        ))}
        {[0, 20, 40, 60, 80, 100, 123].map((km) => (
          <text key={km} x={x(km)} y="186" textAnchor={km === 0 ? "start" : km === 123 ? "end" : "middle"}>
            {km === 123 ? "123 km" : km}
          </text>
        ))}
      </g>
      <g fontSize="12" fontFamily="var(--font-sans)" fill="var(--color-foreground)">
        {TOWNS.map(([km, name]) => {
          const m = PROFILE.reduce((best, p) => (Math.abs(p[0] - km) < Math.abs(best[0] - km) ? p : best))[1];
          return (
            <g key={name}>
              <circle cx={x(km)} cy={y(m)} r="3" fill="var(--color-foreground)" />
              <text x={x(km)} y={y(m) - 8} textAnchor={km === 0 ? "start" : km === 123 ? "end" : "middle"}>
                {name}
              </text>
            </g>
          );
        })}
      </g>
      <text x="334" y="208" textAnchor="middle" fontSize="12" fontFamily="var(--font-sans)" fill="var(--color-muted-foreground)">
        distance from Trieste
      </text>
    </svg>
  );
}

export const post: Post = {
  slug: "parenzana",
  title: "Four days on the Parenzana",
  date: "2026-10-12",
  summary:
    "An old narrow-gauge railway from Trieste to Poreč, ridden by bike through three countries, with a tunnel every few kilometres and more gravel than I had planned for.",
  tags: ["travel", "cycling"],
  minutes: 4,
  body: () => ({
    intro: (
      <>
        <p>
          From 1902 to 1935 a narrow-gauge railway ran from Trieste down the Istrian peninsula to Poreč, carrying wine,
          salt, olive oil and people. It was never fast, and it closed for good when the roads got better. Most of its
          track bed is now a cycling and walking path through Italy, Slovenia and Croatia, and at the start of October
          my partner and I rode the whole thing in four easy days.
        </p>
        <p>
          This is the trip report I wanted to read before we went: where we stopped, what the surface is really like, and
          what I would pack again.
        </p>
      </>
    ),
    sections: [
      {
        id: "why-a-railway",
        title: "Why ride a railway",
        body: (
          <>
            <p>
              A railway built for steam engines climbs gently, because a locomotive pulling wagons can&rsquo;t manage
              much more than three percent. That makes an old line a gift to a cyclist with luggage: you get the views of
              a mountain road with the effort of a long false flat. The Parenzana climbs from the sea to almost 300 metres
              and back down twice, and at no point did we need our lowest gear.
            </p>
            <p>
              The other gift is that railways avoid towns&rsquo; centres and main roads. For most of the 123 kilometres we
              shared the path with walkers, a few other cyclists and, near Motovun, a herd of goats that had right of way.
            </p>
          </>
        ),
      },
      {
        id: "day-by-day",
        title: "Day by day",
        body: (
          <>
            <BlogFigure caption="Height above sea level along the route, from my bike computer. The two climbs are the railway's way over the hills on either side of the Mirna valley.">
              <ElevationProfile />
            </BlogFigure>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Route</th>
                  <th>Distance</th>
                  <th>Climbing</th>
                  <th>Surface</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Trieste to Izola</td>
                  <td align="right">34 km</td>
                  <td align="right">180 m</td>
                  <td>Asphalt, seafront</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Izola to Buje</td>
                  <td align="right">33 km</td>
                  <td align="right">420 m</td>
                  <td>Asphalt, then fine gravel</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Buje to Livade, via Grožnjan</td>
                  <td align="right">31 km</td>
                  <td align="right">310 m</td>
                  <td>Gravel, some loose</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Livade to Poreč</td>
                  <td align="right">35 km</td>
                  <td align="right">390 m</td>
                  <td>Gravel, asphalt at the end</td>
                </tr>
              </tbody>
            </table>
            <p>
              Day one is barely riding: out of Trieste through Muggia, over the border, and along the Slovenian coast on a
              path that is mostly promenade. The long lit tunnel above Strunjan is the first sign that you are on a
              railway. Day two leaves the sea at Lucija and climbs through olive groves and vineyards to the Croatian
              border and Buje.
            </p>
            <p>
              Day three is the best one. The line winds along the hillsides around Grožnjan, a hilltop village of artists
              and very steep streets, then drops through a string of tunnels and over old viaducts into the Mirna valley.
              We stayed in Livade, at the bottom, and ate more truffles than was sensible. Day four climbs out of the
              valley towards Vižinada and rolls down through red-earth fields to Poreč and a swim.
            </p>
          </>
        ),
      },
      {
        id: "tunnels",
        title: "The tunnels",
        body: (
          <p>
            There are around a dozen tunnels between Izola and Vižinada. The long one in Slovenia is lit; most of the
            Croatian ones are not, and some of them curve, so you lose the daylight at the far end. A proper front light
            matters more than anything else on this list. Ours was 400 lumens and that felt like the minimum on loose
            gravel in the dark.
            <BlogFootnoteRef n={1} />
          </p>
        ),
      },
      {
        id: "packing",
        title: "What I'd pack again",
        body: (
          <>
            <ul>
              <li>Tyres at least 35 mm wide. We saw people on road bikes walking the loose sections after Grožnjan.</li>
              <li>A front light that can light a tunnel, and a rear light for the same reason.</li>
              <li>Two bottles each. Between Buje and Livade there is little water outside the villages up the hill.</li>
              <li>Cash. Several of the agriturismi we ate at took nothing else.</li>
            </ul>
            <p>
              What I wouldn&rsquo;t pack again: a stove. There is good food every twenty kilometres, and the one evening
              we cooked for ourselves was the worst meal of the week.
            </p>
          </>
        ),
      },
      {
        id: "getting-there",
        title: "Getting there and back",
        body: (
          <p>
            We took the train from Ljubljana to Trieste, which carries bikes on most services if you book a place. From
            Poreč we came home by bus to Koper and train from there. In summer there are bike buses along the route; in
            October there were none, which is the price of having the path to yourself.
          </p>
        ),
      },
    ],
    footnotes: [
      <>
        The best one, in my opinion, is a cheap head torch worn as well: it points where you look, which on a curve is
        not where the handlebars point.
      </>,
    ],
  }),
};
