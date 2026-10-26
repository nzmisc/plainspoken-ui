import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { Measure } from "../support/measure";

const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc3e6"/><circle cx="34" cy="14" r="6" fill="#f5d76e"/><path d="M0 34 L14 22 L26 32 L36 24 L48 32 V48 H0Z" fill="#5f8f5a"/></svg>`,
  );

const meta = {
  title: "Components/Data display/Avatar",
  component: Avatar,
  args: { name: "Amara Okafor", size: 28, shape: "square" },
  argTypes: { shape: { control: "inline-radio", options: ["square", "circle"] } },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Initials on a colour from the name: the same name always gets the same colour. */
export const Initials: Story = {
  render: () => (
    <p className="flex flex-wrap items-center gap-2">
      {["Amara Okafor", "Jonas Weber", "Li Wei", "María González", "Noah Fischer", "Sofia Rossi", "build-runner-03", "ops@example.com", "ana"].map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </p>
  ),
};

/** A picture sits over the initials; a picture that fails to load leaves them showing. */
export const Pictures: Story = {
  render: () => (
    <p className="flex items-center gap-2">
      <Avatar name="Noah Fischer" src={PHOTO} size={48} />
      <Avatar name="Sofia Rossi" src="/does-not-exist.png" size={48} />
    </p>
  ),
};

/** Square by default, or `shape="circle"`: the one round thing in the library. Pictures and initials work the same in both. */
export const Shapes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(["square", "circle"] as const).map((shape) => (
        <p key={shape} className="flex items-center gap-2">
          <Avatar name="Amara Okafor" shape={shape} size={20} />
          <Avatar name="Jonas Weber" shape={shape} size={24} />
          <Avatar name="Li Wei" shape={shape} />
          <Avatar name="María González" shape={shape} size={36} />
          <Avatar name="Noah Fischer" shape={shape} size={48} src={PHOTO} />
          <Avatar name="Sofia Rossi" shape={shape} size={48} src="/does-not-exist.png" />
        </p>
      ))}
    </div>
  ),
};

/** Size in px. 20, 24, 28 and 36 match the control heights, so an avatar lines up with buttons. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {([20, 24, 28, 36] as const).map((size, i) => (
          <div key={size} className="flex items-center gap-2">
            <span data-measure className="inline-flex">
              <Avatar name="Li Wei" size={size} />
            </span>
            <Button size={(["xs", "sm", "md", "lg"] as const)[i]}>Follow</Button>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <Avatar name="Li Wei" size={48} />
          <Avatar name="Li Wei" size={64} />
          <Avatar name="Li Wei" size={96} />
        </div>
      </div>
    </Measure>
  ),
};

/** Side by side, each ringed in the background colour; past `max`, a "+N" box names the rest on hover. A group's `shape` reaches every avatar in it. */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <AvatarGroup label="Editing now" max={3}>
        <Avatar name="Amara Okafor" />
        <Avatar name="Jonas Weber" />
        <Avatar name="Li Wei" src={PHOTO} />
        <Avatar name="María González" />
        <Avatar name="Noah Fischer" />
        <Avatar name="Sofia Rossi" />
      </AvatarGroup>
      <AvatarGroup size={20}>
        <Avatar name="Amara Okafor" />
        <Avatar name="Jonas Weber" />
      </AvatarGroup>
      <AvatarGroup label="Assigned" shape="circle" max={3}>
        <Avatar name="Amara Okafor" />
        <Avatar name="Jonas Weber" />
        <Avatar name="Li Wei" src={PHOTO} />
        <Avatar name="María González" />
        <Avatar name="Noah Fischer" />
      </AvatarGroup>
    </div>
  ),
};

const CREW: [name: string, role: string][] = [
  ["Amara Okafor", "Editor"], ["Jonas Weber", "Photographer"], ["Li Wei", "Reporter"], ["María González", "Reporter"], ["Noah Fischer", "Sub-editor"],
  ["Sofia Rossi", "Designer"], ["Kenji Watanabe", "Data journalist"], ["Aisha Bello", "Reporter"], ["Lukas Novák", "Video producer"], ["Fatou Diop", "Fact-checker"],
  ["Mateo Silva", "Reporter"], ["Ingrid Berg", "Copy editor"], ["Rahim Chowdhury", "Developer"], ["Elena Popa", "Audience editor"], ["Tomasz Zieliński", "Photographer"],
  ["Nadia Haddad", "Reporter"], ["Oscar Lindgren", "Graphics"], ["Priya Iyer", "Podcast producer"], ["Samuel Mensah", "Reporter"], ["Yuki Hayashi", "Translator"],
  ["Chloé Martin", "Reporter"], ["Diego Herrera", "Sports desk"], ["Hanna Virtanen", "Night editor"], ["Ibrahim Kanté", "Reporter"], ["Jasmine Wong", "Social media"],
  ["Kofi Boateng", "Photographer"], ["Leila Rahimi", "Researcher"], ["Marek Dvořák", "Developer"], ["Nora Ahmed", "Reporter"], ["Olga Ivanova", "Graphics"],
  ["Pedro Alves", "Video producer"], ["Qiu Lan", "Reporter"], ["Rosa Delgado", "Archivist"], ["Sven Holm", "Sub-editor"], ["Tendai Moyo", "Reporter"],
  ["Ulla Schmidt", "Legal"], ["Vikram Rao", "Data journalist"], ["Wiebke Jansen", "Copy editor"], ["Ximena Torres", "Reporter"], ["Zainab Musa", "Intern"],
];

const crew = (n: number) => CREW.slice(0, n).map(([name, role], i) => <Avatar key={name} name={name} detail={role} src={i % 7 === 2 ? PHOTO : undefined} />);

/**
 * Round facepiles of 1, 3, 5 and 40 people, the last two with `max={4}` and `overflow="list"`:
 * the "+N" is a button ("Show all 40 people") that opens a list of everyone, with a box to find
 * someone once there are more than eight.
 */
export const GroupSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[1, 3, 5, 40].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <AvatarGroup label={`${n} on this story`} shape="circle" size={24} overflow="list">
            {crew(n)}
          </AvatarGroup>
          <span className="text-[13px] text-muted-foreground">{n === 1 ? "1 person" : `${n} people`}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * The list open: forty people, each with a detail line, scrolling past about ten, with the search
 * box focused when opened from the keyboard. Escape closes it and puts focus back on the "+N".
 */
export const GroupListOpen: Story = {
  parameters: { docs: { story: { inline: false, height: "520px" } } },
  render: () => (
    <div className="flex min-h-[480px] justify-end">
      <AvatarGroup label="Newsroom" listTitle="Newsroom: 40 people" shape="circle" size={28} max={5} overflow="list" defaultListOpen>
        {crew(40)}
      </AvatarGroup>
    </div>
  ),
};

/** With `onPersonSelect` everyone is a button, in the row and in the list: here, to message them. */
export const GroupSelectable: Story = {
  render: () => (
    <AvatarGroup label="Newsroom" shape="circle" max={5} overflow="list" onPersonSelect={() => {}} personLabel={(name) => `Message ${name}`}>
      {crew(12)}
    </AvatarGroup>
  ),
};
