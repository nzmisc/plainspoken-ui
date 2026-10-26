import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import {
  Announcer,
  BlockMarks,
  DomCursors,
  Facepile,
  PresenceAvatar,
  PresenceFrame,
  PresenceLabel,
  TextareaCursors,
  useAnnouncer,
  type Collaborator,
} from "@/registry/plainspoken/ui/presence";

const AMARA: Collaborator = { id: "amara", name: "Amara Osei", color: 1 };
const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
const TOMAS: Collaborator = { id: "tomas", name: "Tomás Rey", color: 3 };
const PRIYA: Collaborator = { id: "priya", name: "Priya Nair", color: 4 };
const KIM: Collaborator = { id: "kim", name: "Kim Lund", color: 5 };

const meta = {
  title: "Components/Data display/Presence",
  component: Facepile,
  args: {
    people: [{ person: JONAS, status: "typing" }, { person: PRIYA, status: "viewing" }, { person: TOMAS, status: "idle", away: true }],
    caption: "Jonas is typing…",
    label: "Here now",
    max: 4,
    size: 24,
  },
  argTypes: { people: { control: false } },
} satisfies Meta<typeof Facepile>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Who else has it open. Each avatar's name says what that person is doing; those gone quiet are faded. */
export const Playground: Story = {};

/** Nobody else: "Only you", so the space doesn't jump when someone arrives. Past `max`, a "+2". */
export const EmptyAndOverflow: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Facepile people={[]} />
      <Facepile people={[AMARA, JONAS, TOMAS, PRIYA, KIM, { ...KIM, id: "k2", name: "Lena Berg" }].map((person) => ({ person }))} max={4} />
    </div>
  ),
};

/** The five colours (the chart colours), as avatars and as tags. Tags keep ordinary text on a coloured edge, readable in both schemes. */
export const Colours: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {[AMARA, JONAS, TOMAS, PRIYA, KIM].map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <PresenceAvatar person={p} />
          <PresenceLabel person={p}>{p.name.split(" ")[0]} is editing</PresenceLabel>
        </div>
      ))}
    </div>
  ),
};

/** A ring around the field someone is in, outside your own focus ring; the field is described by the tag. */
export const Frame: Story = {
  render: function Render() {
    const [text, setText] = useState("Customers who change the delivery address after checkout still get the old address in the confirmation email.");
    return (
      <div className="flex max-w-xl flex-col gap-1">
        <label htmlFor="frame-field" className="text-[14px] font-semibold">
          Description
        </label>
        <PresenceFrame person={JONAS} label="Jonas is typing…" labelId="frame-tag">
          <Textarea id="frame-field" aria-describedby="frame-tag" value={text} onChange={(e) => setText(e.target.value)} />
        </PresenceFrame>
      </div>
    );
  },
};

/** Carets and selections over a textarea, from offsets; a caret on the first line puts its flag below. */
export const TextareaCursorsStory: Story = {
  name: "Textarea cursors",
  render: function Render() {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState("It happens on web and in the app.\nExpected: the email is sent again with the new address, or the change is blocked once the parcel is packed.");
    return (
      <div className="relative max-w-xl">
        <Textarea ref={ref} aria-label="Description" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        <TextareaCursors
          textarea={ref}
          value={text}
          cursors={[
            { person: JONAS, start: 29, end: 29, label: "Jonas typing" },
            { person: PRIYA, start: 79, end: 90 },
            { person: TOMAS, start: 110, end: 128, highlight: true },
          ]}
        />
      </div>
    );
  },
};

/** Over HTML: DOM Ranges for the caret and selection, a bar beside the paragraph and the name in the gutter. */
export const DocumentCursors: Story = {
  render: function Render() {
    const box = useRef<HTMLDivElement>(null);
    const [first, setFirst] = useState<HTMLParagraphElement | null>(null);
    const [second, setSecond] = useState<HTMLParagraphElement | null>(null);
    return (
      <div ref={box} className="relative max-w-2xl border border-border py-2 pr-32 pl-4">
        <Prose>
          <p ref={setFirst}>The spring sale starts on Friday 14 March at 09:00. This page is the one list of what has to be ready.</p>
          <p ref={setSecond}>Amara watches the order dashboard from 08:30. If checkout errors rise above 2%, we pause the sale banner.</p>
        </Prose>
        <DomCursors
          container={box}
          cursors={[
            { person: JONAS, element: first, start: 44, end: 44 },
            { person: PRIYA, element: second, start: 18, end: 33, label: "Priya (reading)" },
          ]}
          version={!!(first && second)}
        />
        <BlockMarks container={box} marks={[{ person: JONAS, element: first }]} version={!!first} />
      </div>
    );
  },
};

/**
 * useAnnouncer: press quickly, several times. A screen reader hears the first message, then at most
 * one every 3 seconds (the latest), never a stream; focus never moves.
 */
export const ThrottledAnnouncements: Story = {
  render: function Render() {
    const { message, announce } = useAnnouncer(3000);
    const [n, setN] = useState(0);
    return (
      <div className="flex flex-col gap-2 text-[14px]">
        <Button
          className="self-start"
          onClick={() => {
            setN(n + 1);
            announce(`Jonas changed the description (${n + 1}).`);
          }}
        >
          Jonas changes something
        </Button>
        <p>
          Announced last: <q>{message.text || "nothing yet"}</q> (pressed {n} times)
        </p>
        <Announcer message={message} />
      </div>
    );
  },
};
