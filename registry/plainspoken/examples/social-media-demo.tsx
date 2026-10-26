import { PostImage, ProfileBanner } from "@/registry/plainspoken/blocks/social/media";

/** Pictures in posts and a profile banner, all generated from seeds. Every post picture carries alt text; hover ALT to read it. */
export default function SocialMediaDemo() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <ProfileBanner seed="ada" className="border border-border" />
      <div className="grid grid-cols-2 gap-2">
        <PostImage seed="comet" alt="A faint comet with a long pale tail over a dark hillside" ratio={3 / 2} />
        <PostImage seed="ciclovia" alt="A wide avenue full of cyclists, no cars in sight" ratio={3 / 2} />
      </div>
      <PostImage seed="reykjavik-sky" alt="A low pink and violet sky over grey rooftops and a dark sea" />
    </div>
  );
}
