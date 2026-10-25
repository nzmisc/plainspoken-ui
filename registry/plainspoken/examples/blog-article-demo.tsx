import { BlogArticle } from "@/registry/plainspoken/blocks/blog/article";
import { BlogCode, BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";

/** A short post: header, sections with self-linking headings, a code block, a footnote. With three sections or more it adds a table of contents. */
export default function BlogArticleDemo() {
  return (
    <BlogArticle
      size="base"
      header={
        <header className="border-b border-border pb-3">
          <h1 className="text-[24px] font-bold">systemd user units are underrated</h1>
        </header>
      }
      sections={[
        {
          id: "demo-the-unit",
          title: "The unit",
          body: (
            <>
              <p>A user unit is the same file format as a system one, in your home directory:</p>
              <BlogCode
                lang="ini"
                title="~/.config/systemd/user/feeds.service"
                code={"[Service]\nExecStart=%h/bin/feeds serve --port 8081\nRestart=on-failure"}
              />
            </>
          ),
        },
        {
          id: "demo-lingering",
          title: "Lingering",
          body: (
            <p>
              One command, run once as root, keeps your units running after you log out.
              <BlogFootnoteRef n={1} />
            </p>
          ),
        },
        { id: "demo-timers", title: "Timers instead of cron", body: <p>A timer is a second unit that starts a service on a schedule.</p> },
      ]}
      footnotes={[<>Check it with <code>loginctl show-user &quot;$USER&quot; --property=Linger</code>.</>]}
    >
      <p>When people want to keep a small program running on Linux, a user unit would usually do.</p>
    </BlogArticle>
  );
}
