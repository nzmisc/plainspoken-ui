import type { Post } from "../types";

export const post: Post = {
  slug: "small-tools",
  title: "Eight small tools I use every day",
  date: "2026-04-21",
  summary: "Not an editor war or a dotfiles tour: eight single-purpose command-line programs that each save me a few minutes a day.",
  tags: ["tools", "linux"],
  minutes: 3,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          Every so often someone at work watches me use a terminal and asks what a command was. The answer is almost
          always one of the same eight programs. None of them is clever. Each does one job, starts instantly, and has
          been stable for years, which is what I want from a tool I type forty times a day.
        </p>
        <p>The list, then the details:</p>
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Instead of</th>
              <th>For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>rg</code>
              </td>
              <td>
                <code>grep -r</code>
              </td>
              <td>searching code, respecting .gitignore</td>
            </tr>
            <tr>
              <td>
                <code>fd</code>
              </td>
              <td>
                <code>find</code>
              </td>
              <td>finding files by name</td>
            </tr>
            <tr>
              <td>
                <code>jq</code>
              </td>
              <td>squinting</td>
              <td>reading and reshaping JSON</td>
            </tr>
            <tr>
              <td>
                <code>entr</code>
              </td>
              <td>a file watcher in every project</td>
              <td>re-running a command when files change</td>
            </tr>
            <tr>
              <td>
                <code>hyperfine</code>
              </td>
              <td>
                <code>time</code>, once
              </td>
              <td>timing commands properly</td>
            </tr>
            <tr>
              <td>
                <code>mtr</code>
              </td>
              <td>
                <code>ping</code> and <code>traceroute</code>
              </td>
              <td>finding where packets get lost</td>
            </tr>
            <tr>
              <td>
                <code>pv</code>
              </td>
              <td>hoping</td>
              <td>progress bars on pipes</td>
            </tr>
            <tr>
              <td>
                <code>direnv</code>
              </td>
              <td>remembering to source things</td>
              <td>per-directory environment variables</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
    sections: [
      {
        id: "searching",
        title: "Searching: rg and fd",
        body: (
          <>
            <p>
              ripgrep and fd are faster than grep and find, but that isn&rsquo;t why I use them. I use them because their
              defaults are right: they skip <code>.git</code>, <code>node_modules</code> and anything in{" "}
              <code>.gitignore</code>, they search the current directory without being told, and the output is readable.
            </p>
            <Code lang="bash">{`rg -t go 'context.WithTimeout'      # Go files only
rg -l 'TODO\\(ines\\)' | xargs $EDITOR  # open every file with my TODOs
fd -e sql migrations                 # every .sql file under a 'migrations' path`}</Code>
          </>
        ),
      },
      {
        id: "jq",
        title: "jq",
        body: (
          <>
            <p>
              jq is a whole language, and I know about a tenth of it. That tenth covers nearly everything: pick fields,
              filter arrays, count things.
            </p>
            <Code lang="bash">{`curl -s localhost:8081/api/feeds | jq '.[] | select(.errors > 0) | .url'
journalctl -u app -o json | jq -r 'select(.PRIORITY == "3") | .MESSAGE' | sort | uniq -c`}</Code>
          </>
        ),
      },
      {
        id: "entr",
        title: "entr",
        body: (
          <>
            <p>
              entr runs a command whenever any of a list of files changes. It is the file watcher I don&rsquo;t have to
              configure per project, and it is how I write anything with a fast test suite:
            </p>
            <Code lang="bash">{`fd -e go | entr -c go test ./...
ls site/*.md | entr -s 'make html && echo built'`}</Code>
          </>
        ),
      },
      {
        id: "measuring",
        title: "Measuring: hyperfine and mtr",
        body: (
          <>
            <p>
              hyperfine runs a command many times, warms up first, and tells you the mean and the spread. It ended a
              surprising number of arguments at work that had been based on running <code>time</code> once on a laptop
              with a browser open.
            </p>
            <Code lang="bash">{`hyperfine --warmup 3 'sqlite3 app.db < report.sql' 'psql -f report.sql'`}</Code>
            <p>
              mtr is ping and traceroute at once, updated live. When someone says &ldquo;the VPN is slow&rdquo;, ten seconds
              of mtr says which hop is losing packets, and usually that it isn&rsquo;t ours.
            </p>
          </>
        ),
      },
      {
        id: "the-rest",
        title: "pv and direnv",
        body: (
          <>
            <p>
              pv sits in a pipe and shows how much has gone through and how fast. Restoring a 40 GB dump without it is an
              exercise in faith.
            </p>
            <Code lang="bash">{`pv backup.sql.zst | zstd -d | psql app`}</Code>
            <p>
              direnv loads a <code>.envrc</code> when you enter a directory and unloads it when you leave, so database
              URLs and tokens for one project never leak into another shell. It asks before trusting a new file, which is
              the right default for something that runs code on <code>cd</code>.
            </p>
          </>
        ),
      },
    ],
  }),
};
