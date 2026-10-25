import { BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "systemd-user-units",
  title: "systemd user units are underrated",
  date: "2026-08-14",
  summary: "Lingering, timers and the journal for your own services, without root, without a container and without a process manager.",
  tags: ["linux", "tools"],
  minutes: 3,
  body: ({ Code }) => ({
    intro: (
      <p>
        When people want to keep a small program running on a Linux box, they reach for Docker, a root-owned unit in{" "}
        <code>/etc/systemd/system</code>, or a process manager from their language&rsquo;s package registry. Most of the
        time a <em>user</em> unit would do, and it needs no root at all after one command. I run a feed reader, two
        bots and the build of this site that way, and I have stopped thinking about any of them.
      </p>
    ),
    sections: [
      {
        id: "the-unit",
        title: "The unit",
        body: (
          <>
            <p>
              A user unit is the same file format as a system one, in your home directory. Here is the one for the feed
              reader:
            </p>
            <Code lang="ini" title="~/.config/systemd/user/feeds.service">{`[Unit]
Description=Feed reader
After=network-online.target

[Service]
ExecStart=%h/bin/feeds serve --port 8081
Restart=on-failure
RestartSec=5
Environment=FEEDS_DB=%h/.local/share/feeds/feeds.db

[Install]
WantedBy=default.target`}</Code>
            <p>
              <code>%h</code> is your home directory. <code>Restart=on-failure</code> is the process manager. And{" "}
              <code>WantedBy=default.target</code> means &ldquo;start it when my user session starts&rdquo;.
            </p>
          </>
        ),
      },
      {
        id: "lingering",
        title: "Lingering: running when you're not logged in",
        body: (
          <>
            <p>
              By default your user&rsquo;s systemd instance starts when you log in and stops when your last session ends,
              which is not what you want on a server. One command, which does need root once, changes that:
            </p>
            <Code lang="bash">{`sudo loginctl enable-linger "$USER"
systemctl --user daemon-reload
systemctl --user enable --now feeds.service`}</Code>
            <p>
              With lingering on, your user manager starts at boot and your enabled units with it.
              <BlogFootnoteRef n={1} />
            </p>
          </>
        ),
      },
      {
        id: "timers",
        title: "Timers instead of cron",
        body: (
          <>
            <p>
              A timer is a second unit that starts a service on a schedule. It is more typing than a crontab line, and
              worth it: the run is logged, a missed run while the machine was off can be caught up with{" "}
              <code>Persistent=true</code>, and two runs never overlap, because a service that is still running
              isn&rsquo;t started again.
            </p>
            <Code lang="ini" title="~/.config/systemd/user/backup.timer">{`[Timer]
OnCalendar=*-*-* 03:30
RandomizedDelaySec=15m
Persistent=true

[Install]
WantedBy=timers.target`}</Code>
            <p>
              <code>systemctl --user list-timers</code> then shows every schedule with the last and next run, which is
              more than crontab has ever told me.
            </p>
          </>
        ),
      },
      {
        id: "logs",
        title: "Logs for free",
        body: (
          <>
            <p>
              Anything the program writes to standard output or standard error goes to the journal, tagged with the unit,
              rotated and size-limited for you:
            </p>
            <Code lang="bash">{`journalctl --user -u feeds -f          # follow
journalctl --user -u backup --since today
journalctl --user -u feeds -p warning   # warnings and worse`}</Code>
          </>
        ),
      },
      {
        id: "when-not",
        title: "When not to",
        body: (
          <>
            <p>A user unit is the wrong tool when:</p>
            <ul>
              <li>the service must bind a port below 1024 (put a reverse proxy in front instead);</li>
              <li>several people need to manage it: a system unit with a shared group is clearer;</li>
              <li>you need the isolation of a container, not just supervision.</li>
            </ul>
            <p>For everything else, it is already installed and it already works.</p>
          </>
        ),
      },
    ],
    footnotes: [
      <>
        You can check with <code>loginctl show-user &quot;$USER&quot; --property=Linger</code>.
      </>,
    ],
  }),
};
