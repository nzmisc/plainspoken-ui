// What each page of the blog demo shows, as compositions of blocks and content. The route files
// add metadata and structured data around these; Storybook's demo story renders them as they are.
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Code, Mail, MapPin, Rss } from "@/registry/plainspoken/lib/icons";
import { BlogArticle } from "@/registry/plainspoken/blocks/blog/article";
import { BlogFooter } from "@/registry/plainspoken/blocks/blog/footer";
import { BlogHeader } from "@/registry/plainspoken/blocks/blog/header";
import { BlogIntro } from "@/registry/plainspoken/blocks/blog/intro";
import { BlogColumns, BlogPageHeader, BlogSection, BlogShell } from "@/registry/plainspoken/blocks/blog/layout";
import { BlogNow } from "@/registry/plainspoken/blocks/blog/now";
import { BlogPortrait } from "@/registry/plainspoken/blocks/blog/portrait";
import { BlogPostFooter } from "@/registry/plainspoken/blocks/blog/post-footer";
import { BlogPostHeader } from "@/registry/plainspoken/blocks/blog/post-header";
import { BlogArchive, BlogPostList } from "@/registry/plainspoken/blocks/blog/post-list";
import { BlogProfile } from "@/registry/plainspoken/blocks/blog/profile";
import { BlogProjects } from "@/registry/plainspoken/blocks/blog/projects";
import { BlogTags } from "@/registry/plainspoken/blocks/blog/tags";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { POSTS, TAG_LINKS, listItem, neighbours, postsTagged, tagLinks, type Post } from "@/content/blog/posts";
import { AUTHOR, FOOTER_LINKS, NAV, NOW, PROJECTS, WORK, href } from "@/content/blog/site";
import type { CodeProps } from "@/content/blog/types";

/** Header, main and footer around every page. `currentHref` stands in for the router's pathname (Storybook). */
export function BlogFrame({ children, currentHref }: { children: ReactNode; currentHref?: string }) {
  return (
    <BlogShell
      header={<BlogHeader name={AUTHOR.name} homeHref={href.home} links={NAV} feedHref={href.feed} currentHref={currentHref} />}
      footer={
        <BlogFooter
          name={AUTHOR.name}
          tagline={AUTHOR.tagline}
          links={FOOTER_LINKS}
          smallPrint="© 2026 Ines Varga. Words under CC BY 4.0. No tracking, no cookies, no newsletter pop-ups."
        />
      }
    >
      {children}
    </BlogShell>
  );
}

export function HomeView() {
  return (
    <BlogColumns
      asideLabel="Now and projects"
      aside={
        <>
          <BlogNow updated={NOW.updated} items={NOW.items} />
          <BlogSection title="Projects">
            <BlogProjects projects={PROJECTS} />
          </BlogSection>
        </>
      }
    >
      <BlogIntro
        greeting="Hi, I’m Ines."
        portrait={<BlogPortrait name={AUTHOR.name} size={112} />}
        links={[
          { label: "Email", href: `mailto:${AUTHOR.email}`, icon: Mail },
          { label: "RSS feed", href: href.feed, icon: Rss },
          { label: "Code", href: AUTHOR.code, icon: Code },
        ]}
      >
        <p>
          I&rsquo;m a backend and infrastructure engineer in Ljubljana. For a living I keep databases, deploy pipelines and
          on-call rotations boring; here I write about the times they weren&rsquo;t, and about plain web pages, books and
          the odd bike trip.
        </p>
        <p>
          More <Link href={href.about}>about me</Link>, or start with the post people send me the most email about:{" "}
          <Link href={href.post("drain-postgres-primary")}>draining a Postgres primary without dropping writes</Link>.
        </p>
      </BlogIntro>
      <BlogSection title="Recent writing" more={{ label: `All ${POSTS.length} posts`, href: href.posts }}>
        <BlogPostList posts={POSTS.slice(0, 5).map(listItem)} />
      </BlogSection>
    </BlogColumns>
  );
}

export function WritingView() {
  const oldest = POSTS[POSTS.length - 1];
  return (
    <BlogColumns
      asideLabel="Tags"
      aside={
        <BlogSection title="By tag">
          <BlogTags tags={TAG_LINKS} />
        </BlogSection>
      }
    >
      <BlogPageHeader title="Writing">
        <p>
          {POSTS.length} posts since {oldest.date.slice(0, 4)}, newest first. Also as an <a href={href.feed}>RSS feed</a>.
        </p>
      </BlogPageHeader>
      <BlogArchive posts={POSTS.map(listItem)} />
    </BlogColumns>
  );
}

/** A post. `Code` draws its code blocks: highlighted on the server in the app, plain in Storybook. */
export function PostView({ post, Code }: { post: Post; Code: ComponentType<CodeProps> }) {
  const body = post.body({ Code });
  const { older, newer } = neighbours(post.slug);
  const link = (p?: Post) => (p ? { title: p.title, href: href.post(p.slug) } : undefined);
  return (
    <BlogArticle
      header={
        <BlogPostHeader
          title={post.title}
          summary={post.summary}
          date={post.date}
          updated={post.updated}
          minutes={post.minutes}
          tags={tagLinks(post.tags)}
          crumbs={[{ label: "Home", href: href.home }, { label: "Writing", href: href.posts }, { label: post.title }]}
        />
      }
      sections={body.sections}
      footnotes={body.footnotes}
      footer={<BlogPostFooter title={post.title} replyTo={AUTHOR.email} older={link(older)} newer={link(newer)} />}
    >
      {body.intro}
    </BlogArticle>
  );
}

export function TagView({ tag }: { tag: string }) {
  const posts = postsTagged(tag);
  return (
    <BlogColumns
      asideLabel="Tags"
      aside={
        <BlogSection title="Other tags">
          <BlogTags tags={TAG_LINKS} current={tag} />
        </BlogSection>
      }
    >
      <BlogPageHeader title={<>Posts tagged #{tag}</>}>
        <p>
          {posts.length} {posts.length === 1 ? "post carries" : "posts carry"} this tag. The <Link href={href.posts}>archive</Link> has
          the rest.
        </p>
      </BlogPageHeader>
      <BlogPostList posts={posts.map(listItem)} headingLevel={2} />
    </BlogColumns>
  );
}

export function TagsView() {
  return (
    <div className="flex flex-col gap-6">
      <BlogPageHeader title="Tags">
        <p>
          {TAG_LINKS.length} tags across {POSTS.length} posts. Most posts have two.
        </p>
      </BlogPageHeader>
      <BlogTags tags={TAG_LINKS} size="md" />
    </div>
  );
}

export function AboutView() {
  return (
    <BlogColumns asideLabel="Now" aside={<BlogNow updated={NOW.updated} items={NOW.items} />}>
      <BlogProfile
        name={AUTHOR.name}
        role={`${AUTHOR.role} · ${AUTHOR.location}`}
        portrait={<BlogPortrait name={AUTHOR.name} size={96} />}
        contacts={[
          { label: "Email", value: AUTHOR.email, href: `mailto:${AUTHOR.email}`, icon: Mail },
          { label: "Code", value: AUTHOR.codeLabel, href: AUTHOR.code, icon: Code },
          { label: "Feed", value: "RSS: titles, summaries and tags", href: href.feed, icon: Rss },
          { label: "Based in", value: AUTHOR.location, icon: MapPin },
        ]}
      >
        <p>
          I&rsquo;m Ines. I have spent nine years on the part of software that people only notice when it breaks: databases,
          queues, deploys, and the people on call for them. Today I&rsquo;m a staff engineer on the platform team at
          Northwind Freight, where four of us look after the databases, CI and deploy tooling for sixty engineers.
        </p>
        <p>
          I like small tools, written-down runbooks and postmortems that change something. I don&rsquo;t like dashboards
          nobody looks at, or alerts that wake you up to say everything is fine.
        </p>
        <p>
          Outside work I ride bikes, mostly on gravel and mostly slowly, cook too much for two people, and keep a{" "}
          <Link href={href.post("family-wireguard")}>small network</Link> running for a family that doesn&rsquo;t know it has
          one.
        </p>
      </BlogProfile>
      <BlogSection title="Work">
        <DescriptionList
          divided
          className="max-w-[68ch]"
          items={WORK.map((w) => ({
            term: w.when,
            description: (
              <>
                <b className="font-semibold">{w.what}</b>, {w.where}
              </>
            ),
          }))}
        />
      </BlogSection>
      <BlogSection title="Colophon">
        <Prose>
          <p>
            Posts are written in Markdown and kept in a git repository. The site is rendered to HTML on the server, with one
            stylesheet and code highlighted at build time, so there is nothing to download before you can read. It follows
            your system&rsquo;s light or dark setting.
          </p>
          <p>
            There are no analytics, no cookies and no comments. If something here was useful or wrong,{" "}
            <a href={`mailto:${AUTHOR.email}`}>email me</a>; I answer most of it.
          </p>
        </Prose>
      </BlogSection>
    </BlogColumns>
  );
}
