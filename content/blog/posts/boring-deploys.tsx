import { BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "boring-deploys",
  title: "A boring deploy pipeline in 140 lines of shell",
  date: "2026-03-19",
  summary: "Build, copy, swap a symlink, restart, check health, roll back if it's unhappy. No orchestrator required.",
  tags: ["shell", "ops"],
  minutes: 3,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          At work we deploy fourteen services to a handful of machines. For years that went through a deploy tool with
          its own server, its own database and its own on-call rotation. Last year we replaced it with a shell script.
          Deploys went from 25 minutes to 4, and the number of people who understand how a deploy works went from two to
          everyone who can read Bash.
        </p>
        <p>
          The script is 140 lines including comments. Here is what it does, and the handful of decisions that make it
          safe.
        </p>
      </>
    ),
    sections: [
      {
        id: "six-steps",
        title: "Six steps",
        body: (
          <>
            <ol>
              <li>Build the release on the CI runner, as one tarball named after the commit.</li>
              <li>
                Copy it to every target into <code>/srv/app/releases/&lt;commit&gt;</code>, in parallel.
              </li>
              <li>
                On each target, point the <code>current</code> symlink at the new release, atomically.
              </li>
              <li>Restart the service with systemd.</li>
              <li>Poll the health endpoint for up to 30 seconds.</li>
              <li>If it never comes up healthy, point the symlink back and restart again.</li>
            </ol>
            <p>
              Targets are done one at a time behind the load balancer, so a bad release takes down one machine for half a
              minute and then stops.
            </p>
          </>
        ),
      },
      {
        id: "the-swap",
        title: "The swap",
        body: (
          <>
            <p>
              The heart of it is replacing a symlink without a moment where it doesn&rsquo;t exist. <code>ln -sfn</code>{" "}
              isn&rsquo;t atomic: it removes the old link, then creates the new one. Creating the new link under a
              temporary name and renaming it over the old one is, because a rename within one filesystem is a single
              operation.
              <BlogFootnoteRef n={1} />
            </p>
            <Code lang="bash" title="deploy.sh (excerpt)">{`activate() {
  local host=$1 release=$2
  ssh "$host" "
    set -e
    ln -s /srv/app/releases/$release /srv/app/current.tmp
    mv -T /srv/app/current.tmp /srv/app/current
    systemctl restart app.service
  "
}

healthy() {
  local host=$1
  for _ in $(seq 30); do
    curl -fsS --max-time 1 "http://$host:8080/healthz" >/dev/null && return 0
    sleep 1
  done
  return 1
}`}</Code>
          </>
        ),
      },
      {
        id: "rollback",
        title: "Rolling back is the same thing backwards",
        body: (
          <>
            <p>
              Because old releases stay on disk (we keep the last five), rolling back is calling <code>activate</code>{" "}
              with the previous commit. No rebuild, no download, no special path that only gets exercised during an
              incident. The script records which release was live before it started, so the rollback target is never a
              guess.
            </p>
            <Code lang="bash">{`for host in $HOSTS; do
  previous=$(ssh "$host" readlink /srv/app/current | xargs basename)
  activate "$host" "$RELEASE"
  if ! healthy "$host"; then
    echo "!! $host unhealthy on $RELEASE, rolling back to $previous" >&2
    activate "$host" "$previous"
    exit 1
  fi
done`}</Code>
          </>
        ),
      },
      {
        id: "what-we-left-out",
        title: "What we left out",
        body: (
          <>
            <p>
              No canaries beyond &ldquo;one machine at a time&rdquo;. No percentage rollouts. No dashboard: the deploy log
              is the CI job&rsquo;s output, and the history is the git log. We add things when an incident asks for them,
              and in a year none has.
            </p>
            <blockquote>
              <p>A deploy system should be the most boring code you own. You will read it during the worst hour of your year.</p>
            </blockquote>
          </>
        ),
      },
    ],
    footnotes: [
      <>
        <code>mv -T</code> treats the destination as a file even though it is a symlink to a directory, so it renames
        rather than moving the temporary link into the old release.
      </>,
    ],
  }),
};
