import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { HoverCard, HoverCardActions, HoverCardFacts, HoverCardHeader } from "@/registry/plainspoken/ui/hover-card";

/**
 * Hover the trigger (opens after 350 ms), or Tab to it (at once) and Tab again into the card.
 * Escape closes it. On a phone, the first tap opens the card and a second tap follows the link.
 */
const meta = {
  title: "Components/Overlays/Hover card",
  component: HoverCard,
  decorators: [(Story) => <div className="min-h-80">{Story()}</div>],
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const link = "text-link underline visited:text-link-visited";

const profile = (
  <>
    <span className="flex gap-3 px-3 pt-3">
      <Avatar name="Ada Okonkwo" size={44} />
      <span className="flex min-w-0 flex-col">
        <b>Ada Okonkwo</b>
        <span className="text-muted-foreground">@ada</span>
      </span>
    </span>
    <span className="block px-3 pt-2">Builds trains in Lisbon. Writes about timetables, rolling stock and the joy of a well-run interchange.</span>
    <HoverCardFacts
      rows={[
        ["Joined", "March 2019"],
        ["Followers", "4,810"],
      ]}
    />
    <HoverCardActions>
      <a href="#ada" className={link}>
        Profile
      </a>
      <Button size="sm" variant="primary" className="ml-auto">
        Follow
      </Button>
    </HoverCardActions>
  </>
);

const order = (
  <>
    <HoverCardHeader title="Order NW-20418" aside={<span className="text-muted-foreground">Paid</span>} />
    <HoverCardFacts
      rows={[
        ["Placed", "23 Oct, 14:02"],
        ["Ship to", "Hannah Lindqvist, Stockholm"],
        ["Items", "4"],
        ["Total", "€160.00"],
        ["Note", ""],
      ]}
    />
    <HoverCardActions>
      <a href="#NW-20418" className={link}>
        Open order
      </a>
      <span className="ml-auto">
        <CopyButton text="NW-20418" label="Copy number" size="sm" />
      </span>
    </HoverCardActions>
  </>
);

/** Closed. Hover it, focus it with Tab (then Tab again into the card), or tap it on a phone. */
export const Closed: Story = {
  args: {
    label: "Ada Okonkwo's profile",
    card: profile,
    children: (
      <a href="#ada" className={link}>
        @ada
      </a>
    ),
  },
};

/** A profile, as in the social demo, open on load. */
export const Profile: Story = { tags: ["!autodocs"], args: { ...Closed.args!, label: "Ada Okonkwo's profile", card: profile, defaultOpen: true } };

/** Facts with a header and actions. Rows with an empty value ("Note") are left out. */
export const Facts: Story = {
  tags: ["!autodocs"],
  args: {
    label: "Order NW-20418",
    card: order,
    defaultOpen: true,
    children: (
      <a href="#NW-20418" className={`${link} font-mono`}>
        NW-20418
      </a>
    ),
  },
};

/** In running text: the card is a span, so it is valid inside a paragraph. */
export const InText: Story = {
  args: { label: "", card: null, children: null },
  render: () => (
    <p className="max-w-prose">
      Lovely evening with{" "}
      <HoverCard label="Ada Okonkwo's profile" card={profile}>
        <a href="#ada" className={link}>
          @ada
        </a>
      </HoverCard>{" "}
      and the rest of the type meetup; order{" "}
      <HoverCard label="Order NW-20418" card={order}>
        <a href="#NW-20418" className={`${link} font-mono`}>
          NW-20418
        </a>
      </HoverCard>{" "}
      is the poster.
    </p>
  ),
};

/** At the right edge of a phone the card shifts left to stay fully visible. */
export const NearEdge: Story = {
  tags: ["!autodocs"],
  globals: { viewport: { value: "iphoneSE" } },
  args: { ...Profile.args!, label: "Ada Okonkwo's profile", card: profile },
  decorators: [(Story) => <div className="flex justify-end">{Story()}</div>],
};
