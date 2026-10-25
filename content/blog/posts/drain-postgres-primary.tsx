import { BlogFigure, BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

/** p99 write latency around the switchover, drawn in theme colours so it works in light and dark. */
function LatencyChart() {
  // 60 seconds of p99 samples, one every 2 s; the pause is from 14:02:30 to 14:02:35
  const ms = [11, 10, 12, 11, 10, 11, 13, 11, 10, 12, 11, 10, 11, 12, 11, 148, 152, 139, 12, 11, 10, 11, 12, 10, 11, 11, 10, 12, 11, 10, 11];
  const x = (i: number) => 48 + (i / (ms.length - 1)) * 572;
  const y = (v: number) => 180 - (v / 160) * 160;
  return (
    <svg viewBox="0 0 640 214" className="h-auto w-full min-w-[480px]" role="img" aria-labelledby="latency-title">
      <title id="latency-title">
        Write latency stays near 11 ms, rises to about 150 ms for the five seconds of the pause, then returns to 11 ms.
      </title>
      <g stroke="var(--color-border)" strokeWidth="1">
        <line x1="48" y1="20" x2="48" y2="180" />
        <line x1="48" y1="180" x2="620" y2="180" />
        {[50, 100, 150].map((v) => (
          <line key={v} x1="48" y1={y(v)} x2="620" y2={y(v)} strokeDasharray="2 4" />
        ))}
      </g>
      <g fill="var(--color-muted-foreground)" fontSize="12" fontFamily="var(--font-sans)">
        {[0, 50, 100, 150].map((v) => (
          <text key={v} x="40" y={y(v) + 4} textAnchor="end">
            {v === 150 ? "150 ms" : v}
          </text>
        ))}
        <text x="48" y="200">
          14:02:00
        </text>
        <text x="334" y="200" textAnchor="middle">
          14:02:30
        </text>
        <text x="620" y="200" textAnchor="end">
          14:03:00
        </text>
        <text x={(x(15) + x(17)) / 2} y="14" textAnchor="middle">
          paused
        </text>
      </g>
      <rect x={x(14.6)} y="20" width={x(17.4) - x(14.6)} height="160" fill="var(--color-chart-1)" opacity="0.14" />
      <polyline
        fill="none"
        stroke="var(--color-chart-1)"
        strokeWidth="2"
        strokeLinejoin="round"
        points={ms.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
      />
    </svg>
  );
}

export const post: Post = {
  slug: "drain-postgres-primary",
  title: "Draining a Postgres primary without dropping writes",
  date: "2026-09-28",
  summary: "A planned switchover that the application never noticed, and the three things that almost broke it.",
  tags: ["postgres", "ops"],
  minutes: 4,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          Last Tuesday we moved the primary of our main Postgres cluster to new hardware. The goal was the dull kind of
          success: no failed writes, no alerts, nobody in the company noticing. We got there, but three things nearly
          turned it into an incident. This is the runbook we ended up with, and the reasons behind each step.
        </p>
        <p>
          None of it is new. Every piece is in the Postgres and PgBouncer manuals. What took us four rehearsals to learn
          was the order, and which of the checks are gates and which are only reassurance.
        </p>
      </>
    ),
    sections: [
      {
        id: "the-setup",
        title: "The setup",
        body: (
          <>
            <p>
              One primary, two streaming replicas, and PgBouncer in front in <code>transaction</code> pool mode. The
              application connects only to PgBouncer, never to a database directly, which is what makes a pause possible at
              all.
              <BlogFootnoteRef n={1} /> The new primary was already running as a third replica, fed by streaming
              replication, for a week before the switch.
            </p>
            <p>
              We write about 1,800 transactions a second at the daily peak and about 300 at the hour we picked, 14:00 on a
              Tuesday. Choosing a quiet hour is not about load. It is about how many transactions are in flight when you
              pause, because every one of them has to finish before the pause takes effect.
            </p>
          </>
        ),
      },
      {
        id: "the-runbook",
        title: "The runbook",
        body: (
          <>
            <ol>
              <li>Check that the target replica is caught up: replay lag under 1 MB, and no transaction older than 10 s.</li>
              <li>
                <code>PAUSE</code> the pool in PgBouncer. New transactions queue in PgBouncer; running ones finish.
              </li>
              <li>Read the old primary&rsquo;s last WAL position, and wait until the target has replayed up to it.</li>
              <li>
                Promote the target, point PgBouncer at it, <code>RESUME</code>.
              </li>
            </ol>
            <p>The part that matters is step 3. This is the check, run against both machines:</p>
            <Code lang="sql" title="the gate">{`-- on the old primary, after PAUSE
SELECT pg_current_wal_lsn();          -- e.g. 3F/9A0021C8

-- on the target, poll until it returns true
SELECT pg_last_wal_replay_lsn() >= '3F/9A0021C8'::pg_lsn AS caught_up;`}</Code>
            <p>And the whole thing, wrapped up so nobody has to type it at two in the morning:</p>
            <Code lang="bash" title="switchover.sh">{`#!/usr/bin/env bash
set -euo pipefail

psql "$BOUNCER" -c 'PAUSE app;'
lsn=$(psql -At "$OLD" -c 'SELECT pg_current_wal_lsn()')

until psql -At "$NEW" -c "SELECT pg_last_wal_replay_lsn() >= '$lsn'" | grep -q t; do
  sleep 0.1
done

psql "$NEW" -c 'SELECT pg_promote(wait => true);'
sed -i "s/host=$OLD_HOST/host=$NEW_HOST/" /etc/pgbouncer/pgbouncer.ini
psql "$BOUNCER" -c 'RELOAD;' -c 'RESUME app;'`}</Code>
            <p>
              There is deliberately no timeout on the loop. If the target never catches up, something is badly wrong, and
              a human should decide whether to resume on the old primary. The script prints the LSNs as it goes so that
              human has something to look at.
            </p>
          </>
        ),
      },
      {
        id: "what-the-application-saw",
        title: "What the application saw",
        body: (
          <>
            <BlogFigure caption="p99 write latency around the switchover, in 2-second buckets. The shaded band is the 5.2-second pause.">
              <LatencyChart />
            </BlogFigure>
            <p>
              Writes slowed down for five seconds and then carried on. No errors reached the application, because a paused
              pool looks like a slow database, not a missing one. The HTTP layer has a 30-second timeout, so a 5-second
              stall was invisible to users apart from one slow page each.
            </p>
          </>
        ),
      },
      {
        id: "three-things",
        title: "The three things that almost broke it",
        body: (
          <>
            <table>
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Symptom</th>
                  <th>Time lost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A long-running report held a transaction open</td>
                  <td>
                    <code>PAUSE</code> waited for it to finish
                  </td>
                  <td align="right">38 s</td>
                </tr>
                <tr>
                  <td>
                    <code>server_check_query</code> ran against the old primary after promotion
                  </td>
                  <td>PgBouncer marked the new servers bad</td>
                  <td align="right">12 s</td>
                </tr>
                <tr>
                  <td>A DNS name with a 300-second TTL</td>
                  <td>A cron job wrote to the demoted node</td>
                  <td align="right">none</td>
                </tr>
              </tbody>
            </table>
            <p>
              The first happened in the second rehearsal, and is why step 1 now refuses to start if any transaction is
              older than ten seconds.
              <BlogFootnoteRef n={2} /> The second was a typo in the config template. The third is the one that scared
              us: the cron job bypassed PgBouncer, connected by a DNS name, and kept writing to the old primary for a few
              minutes after it was demoted. Those writes failed, loudly, because a demoted primary is read-only. Nothing
              was lost. But it would have been, had we not fenced the old node first.
            </p>
            <blockquote>
              <p>A switchover you have rehearsed is a deploy. One you haven&rsquo;t is an incident with extra steps.</p>
            </blockquote>
          </>
        ),
      },
      {
        id: "takeaways",
        title: "Takeaways",
        body: (
          <ul>
            <li>Pause, don&rsquo;t fail. Clients handle slow far better than they handle errors.</li>
            <li>Make the LSN check the gate, not a timer. A timer is a guess about replication lag.</li>
            <li>Nothing gets to talk to the database except through the pooler. Not cron, not the admin panel, not you.</li>
            <li>
              Rehearse on staging until it is boring. We ran it eleven times; the scripts are in{" "}
              <a href="https://code.example.org/ines/pgdrain">pgdrain</a>.
            </li>
          </ul>
        ),
      },
    ],
    footnotes: [
      <>
        Session pool mode would also work, but every client then holds its server connection for the whole pause, and
        you need as many server connections as clients.
      </>,
      <>
        <code>SELECT max(now() - xact_start) FROM pg_stat_activity WHERE state &lt;&gt; &apos;idle&apos;;</code>
      </>,
    ],
  }),
};
