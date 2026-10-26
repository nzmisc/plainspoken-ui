import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { QueueDrawer, QueueList } from "@/registry/plainspoken/blocks/music/queue";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof QueueList> = {
  title: "Blocks/Music/Queue",
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  component: QueueList,
  decorators: [
    (S) => (
      <MusicProvider initial={demoPlayback("deep-focus", { track: 0, upNext: ["brighter--brighter", "kingsway-nights--kingsway-nights"] })}>
        <div className="max-w-sm border border-border">{S()}</div>
      </MusicProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof QueueList>;

/** Now playing, two songs in the queue (each removable), then the rest of the playlist. */
export const WithQueue: Story = { args: { limit: 8 } };

/** Nothing loaded. */
export const Empty: Story = { decorators: [(S) => <MusicProvider>{S()}</MusicProvider>] };

/** In its drawer. */
export const Drawer: Story = { render: () => <QueueDrawer open onClose={() => {}} /> };
