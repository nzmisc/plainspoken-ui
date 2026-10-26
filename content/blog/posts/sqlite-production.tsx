import { BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "sqlite-production",
  title: "SQLite in production: the parts that bit me",
  date: "2025-07-22",
  summary: "WAL checkpoints that never finished, writers that waited forever, and backups that were quietly empty for a month.",
  tags: ["sqlite", "ops"],
  minutes: 3,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          For three years I ran a small internal service on SQLite: one Go binary, one database file, a few hundred
          requests a minute. It was the most reliable thing I owned. It also taught me three lessons the hard way, each
          of which is a single line in the documentation that I had read and not understood.
        </p>
        <p>The settings I now start every SQLite database with:</p>
        <Code lang="sql" title="on every connection">{`PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;`}</Code>
      </>
    ),
    sections: [
      {
        id: "checkpoint-starvation",
        title: "The WAL that grew to 9 GB",
        body: (
          <>
            <p>
              In WAL mode, writes go to a separate log file, and a <em>checkpoint</em> copies them back into the database
              now and then. A checkpoint can only copy pages that no reader still needs. Our dashboard kept a read
              transaction open for as long as a browser tab was open, so the checkpoint could never finish, and the WAL
              file grew by 300 MB a day until the disk filled.
            </p>
            <p>
              The fix was in our code, not in SQLite: never hold a read transaction across anything slow, and certainly
              not across a network request. We also added a check that alerts when the <code>-wal</code> file is larger
              than the database itself.
            </p>
          </>
        ),
      },
      {
        id: "busy",
        title: "Writers that waited, or didn't",
        body: (
          <>
            <p>
              SQLite allows one writer at a time. Without a busy timeout, a second writer fails at once with{" "}
              <code>SQLITE_BUSY</code>; with the timeout, it waits up to that long. We had no timeout, so about one write
              in ten thousand failed under load, and the retry logic made the bursts worse.
            </p>
            <p>
              The other half of the fix: start write transactions with <code>BEGIN IMMEDIATE</code>. A transaction that
              begins as a reader and later tries to write can deadlock against another one doing the same, and in that
              case SQLite returns busy at once, timeout or not.
              <BlogFootnoteRef n={1} />
            </p>
            <Code lang="go">{`tx, err := db.BeginTx(ctx, nil)            // deferred: can fail late
_, err = conn.ExecContext(ctx, "BEGIN IMMEDIATE") // takes the write lock up front`}</Code>
          </>
        ),
      },
      {
        id: "backups",
        title: "The backups that were empty",
        body: (
          <>
            <p>
              Copying a live SQLite file with <code>cp</code> gives you a database that may or may not be consistent,
              depending on what was being written at the time. We knew that, so we used the online backup API. What we
              didn&rsquo;t know was that our script backed up a path relative to the working directory, which a systemd
              change had moved, so for a month it faithfully backed up a brand-new empty database every night.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Safe while writing?</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>cp app.db</code>
                  </td>
                  <td>No</td>
                  <td>Can copy a half-written page</td>
                </tr>
                <tr>
                  <td>
                    <code>.backup</code> (sqlite3 shell)
                  </td>
                  <td>Yes</td>
                  <td>Uses the online backup API</td>
                </tr>
                <tr>
                  <td>
                    <code>VACUUM INTO</code>
                  </td>
                  <td>Yes</td>
                  <td>Also compacts; needs free space for a full copy</td>
                </tr>
                <tr>
                  <td>Litestream-style WAL shipping</td>
                  <td>Yes</td>
                  <td>Continuous, point-in-time restore</td>
                </tr>
              </tbody>
            </table>
            <p>
              We now restore last night&rsquo;s backup into a scratch directory every morning and count the rows in the
              three biggest tables. A backup you haven&rsquo;t restored is a hope, not a backup.
            </p>
          </>
        ),
      },
      {
        id: "would-i-again",
        title: "Would I do it again?",
        body: (
          <p>
            Yes, for anything with one server and a modest write rate. All three problems were mine, not SQLite&rsquo;s,
            and every one of them would have bitten me just as hard with Postgres. The difference is that with SQLite
            there was nobody else to blame, and the whole system fitted in my head while I fixed it.
          </p>
        ),
      },
    ],
    footnotes: [
      <>
        The documentation calls this out under <code>sqlite3_busy_timeout</code>: the busy handler is not called when
        SQLite decides that waiting could only lead to a deadlock.
      </>,
    ],
  }),
};
