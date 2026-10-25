import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/registry/plainspoken/blocks/social/nav";
import { ProfileHeader, ProfileTabs } from "@/registry/plainspoken/blocks/social/profile";
import { SOCIAL_BASE, USERS, findUser, postsBy } from "@/registry/plainspoken/blocks/social/data";

export function generateStaticParams() {
  return USERS.map((u) => ({ handle: u.handle }));
}

export async function generateMetadata({ params }: PageProps<"/demos/social/u/[handle]">): Promise<Metadata> {
  const u = findUser((await params).handle);
  if (!u) return {};
  return { title: `${u.name} (@${u.handle})`, description: u.bio };
}

export default function ProfilePage({ params }: PageProps<"/demos/social/u/[handle]">) {
  return (
    <Suspense fallback={<p className="p-4 text-muted-foreground">Loading profile…</p>}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const u = findUser(handle);
  if (!u) notFound();
  const count = postsBy(handle).length;
  return (
    <>
      <PageHeader title={u.name} subtitle={`${count} post${count === 1 ? "" : "s"}`} backHref={SOCIAL_BASE} />
      <ProfileHeader handle={handle} />
      <ProfileTabs handle={handle} />
    </>
  );
}
