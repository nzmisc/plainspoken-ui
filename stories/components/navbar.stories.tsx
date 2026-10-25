import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createContext, use, useState } from "react";
import { Bell, ChevronDown, Menu, Search } from "@/registry/plainspoken/lib/icons";
import type { NavLinkProps } from "@/registry/plainspoken/lib/nav";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Navbar, type NavbarLink, type NavbarProps } from "@/registry/plainspoken/ui/navbar";
import { Measure } from "../support/measure";

const LINKS: NavbarLink[] = [
  { key: "dashboard", label: "Dashboard", href: "#dashboard" },
  { key: "servers", label: "Servers", href: "#servers" },
  { key: "logs", label: "Logs", href: "#logs" },
  { key: "docs", label: "Docs", href: "#docs" },
];

const actions = (
  <>
    <Input type="search" aria-label="Search" placeholder="Search" prefix={Search} className="w-44" />
    <IconButton variant="ghost" icon={Bell} label="Notifications" />
    <Button variant="ghost" iconEnd={ChevronDown}>
      ana
    </Button>
  </>
);

function Live(props: Partial<NavbarProps>) {
  const [current, setCurrent] = useState("dashboard");
  return <Navbar brand="atlas" brandHref="#home" links={LINKS} current={current} onNavigate={setCurrent} {...props} />;
}

const meta = {
  title: "Components/Navigation/Navbar",
  component: Navbar,
  parameters: { layout: "fullscreen" },
  args: { brand: "atlas", brandHref: "#home", links: LINKS, current: "dashboard", phone: "menu" },
  argTypes: {
    phone: { control: "inline-radio", options: ["menu", "hide"] },
    leading: { control: false },
    actions: { control: false },
    linkAs: { control: false },
  },
} satisfies Meta<typeof Navbar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every simple prop in the Controls panel. */
export const Playground: Story = {};

/** Brand and links. The current page is bold with a bar under it, not a blue link; its width doesn't change when it becomes bold. Click to move it. */
export const Basic: Story = { render: () => <Live /> };

/** A search box, an icon button and an account button on the right: all one height, centred in the 40px bar. */
export const WithActions: Story = {
  render: () => (
    <Measure>
      <Live actions={actions} />
    </Measure>
  ),
};

/**
 * Phone width: links and actions fold into a Menu button that opens a panel under the bar
 * (aria-expanded on the button). Escape closes it and puts focus back on the button; following a
 * link closes it too.
 */
export const PhoneMenu: Story = {
  render: () => <Live actions={actions} />,
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};

/** phone="hide": on phones the links go away, for when a drawer lists them instead (AppShell does this). Actions stay. */
export const PhoneHide: Story = {
  render: () => (
    <Live
      phone="hide"
      leading={<IconButton variant="ghost" icon={Menu} label="Open navigation" />}
      actions={
        <Button variant="ghost" iconEnd={ChevronDown}>
          ana
        </Button>
      }
    />
  ),
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};

/** With a leading control, as the app shell uses it for the sidebar toggle. */
export const WithLeading: Story = {
  render: () => <Live actions={actions} leading={<IconButton variant="ghost" icon={Menu} label="Hide sidebar" />} />,
};

const Navigate = createContext<(href: string) => void>(() => {});
function FakeLink({ href, onClick, ...rest }: NavLinkProps) {
  const navigate = use(Navigate);
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}

/**
 * Driven by a router: `linkAs` draws the links (next/link's Link in a Next.js app) and
 * `currentHref` is the pathname; the link with the longest matching path is current.
 */
export const FromPathname: Story = {
  render: function Render() {
    const [pathname, setPathname] = useState("/servers/atlas/disks");
    const links = [
      { key: "dashboard", label: "Dashboard", href: "/" },
      { key: "servers", label: "Servers", href: "/servers" },
      { key: "logs", label: "Logs", href: "/logs" },
    ];
    return (
      <Navigate value={setPathname}>
        <Navbar brand="atlas" brandHref="/" links={links} linkAs={FakeLink} currentHref={pathname} />
        <p className="p-3 text-muted-foreground">
          pathname: <code>{pathname}</code>
        </p>
      </Navigate>
    );
  },
};

/** Long brand, many links: between md and a wide screen the links scroll sideways rather than push the actions out; below md they fold into the menu. */
export const ManyLinks: Story = {
  render: () => (
    <Live
      brand="Northwind Traders Partner Portal"
      links={[
        ...LINKS,
        { key: "billing", label: "Billing", href: "#billing" },
        { key: "support", label: "Support", href: "#support" },
      ]}
      actions={<Button variant="primary">Sign in</Button>}
    />
  ),
};

/** No brand link, no links: just a title and actions, e.g. a single-page tool. */
export const TitleOnly: Story = {
  render: () => <Navbar brand="Invoice generator" actions={<Button variant="primary">Download PDF</Button>} />,
};

const MUSIC: NavbarLink[] = [
  { key: "home", label: "Home", href: "/music" },
  { key: "search", label: "Search", href: "/music/search" },
  { key: "library", label: "Library", href: "/music/library" },
];

/**
 * Matching `currentHref`. Home ("/music") is a root, a prefix of the other links, so it is only
 * current on its own page: on "/music/artist/nils-frahm", which no link covers, nothing is marked
 * (not Home). Deeper pages under a non-root link still mark it ("/music/library/playlist/7" marks
 * Library). `exact: false` on Home makes it the fallback for every page under it; `exact: true`
 * on any link limits it to its own page.
 */
export const CurrentHrefMatching: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(
        [
          ["/music", MUSIC],
          ["/music/library/playlist/7", MUSIC],
          ["/music/artist/nils-frahm", MUSIC],
          ["/music/artist/nils-frahm", MUSIC.map((l) => (l.key === "home" ? { ...l, exact: false } : l)), "Home with exact: false"],
          ["/music/library/playlist/7", MUSIC.map((l) => (l.key === "library" ? { ...l, exact: true } : l)), "Library with exact: true"],
        ] as [string, NavbarLink[], string?][]
      ).map(([href, links, note], i) => (
        <div key={i}>
          <p className="px-3 pb-1 text-[13px] text-muted-foreground">
            currentHref <code>{href}</code>
            {note && `, ${note}`}
          </p>
          <Navbar brand="Tunes" brandHref="/music" links={links} currentHref={href} phone="hide" />
        </div>
      ))}
    </div>
  ),
};

/** `contentClassName` on the row inside the bar: here centred at max-w-3xl, like the page under it, while the bar's background and border stay full width. */
export const CentredContent: Story = {
  render: () => (
    <div>
      <Navbar brand="Ines Moreau" brandHref="#home" links={LINKS} current="servers" contentClassName="mx-auto max-w-3xl" />
      <main className="mx-auto max-w-3xl px-2 py-4 sm:px-3">
        <p>The brand lines up with this text, and the actions end where it ends.</p>
      </main>
    </div>
  ),
};
