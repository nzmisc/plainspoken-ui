import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Pagination } from "@/registry/plainspoken/ui/pagination";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Navigation/Pagination",
  component: Pagination,
  args: { page: 7, pageCount: 14 },
  argTypes: { size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] } },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(args.page);
    return <Pagination {...args} page={page} onChange={setPage} />;
  },
};

/** Full on wide screens; on phones only Previous, Next and "Page 7 of 14". With the row range and rows-per-page. */
export const Full: Story = {
  render: function Render() {
    const [p, setP] = useState(7);
    const [size, setSize] = useState(25);
    const total = 340;
    const pages = Math.ceil(total / size);
    return (
      <Measure>
        <Pagination
          page={Math.min(p, pages)}
          pageCount={pages}
          onChange={setP}
          total={total}
          pageSize={size}
          pageSizes={[10, 25, 50, 100]}
          onPageSizeChange={(s) => {
            setSize(s);
            setP(1);
          }}
        />
      </Measure>
    );
  },
};

/** Few pages: no gaps. First and last pages: Previous or Next disabled. */
export const Edges: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Pagination page={1} pageCount={4} onChange={() => {}} />
      <Pagination page={4} pageCount={4} onChange={() => {}} />
      <Pagination page={1} pageCount={1} onChange={() => {}} />
      <Pagination page={6} pageCount={200} siblings={2} onChange={() => {}} />
    </div>
  ),
};

export const Compact: Story = {
  render: function Render() {
    const [p, setP] = useState(3);
    return <Pagination compact page={p} pageCount={14} onChange={setP} />;
  },
};

/** href: real links (with aria-current on the page), no JavaScript needed. Disabled ends are spans with aria-disabled. */
export const Links: Story = { args: { page: 1, pageCount: 12, href: (p: number) => `#page-${p}` } };

/** Every part of the strip is one control height, at every size. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <Pagination key={s} size={s} page={5} pageCount={9} onChange={() => {}} total={220} pageSize={25} />
        ))}
      </div>
    </Measure>
  ),
};

export const Phone: Story = {
  ...Full,
  parameters: { viewport: { defaultViewport: "iphoneSE" } },
  decorators: [(S) => <div className="w-[343px]"><S /></div>],
};
