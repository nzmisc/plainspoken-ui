import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildTheme, COLOR_TOKENS } from "@/lib/theme";

/**
 * Every colour token of the default theme, as CSS variables in shadcn/ui's names. The swatches use
 * the live variables, so they follow the Theme toolbar.
 */
const meta: Meta = { title: "Foundations/Colours" };
export default meta;

const PAIRS: [string, string][] = [
  ["background", "foreground"],
  ["card", "card-foreground"],
  ["popover", "popover-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["muted", "muted-foreground"],
  ["accent", "accent-foreground"],
];

/** Surfaces with the text that goes on them */
export const Surfaces: StoryObj = {
  render: () => (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {PAIRS.map(([bg, fg]) => (
        <div key={bg} className="border border-border p-3" style={{ background: `var(--${bg})`, color: `var(--${fg === "muted-foreground" ? "foreground" : fg})` }}>
          <div className="font-mono text-[12px]">{bg}</div>
          <div className="mt-2 text-[14px]" style={{ color: `var(--${fg})` }}>
            Text in {fg}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Every token, light and dark side by side (the values, not the live variables) */
export const AllTokens: StoryObj = {
  render: () => {
    const t = buildTheme();
    return (
      <table className="text-[13px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
        <thead>
          <tr>
            <th>Token</th>
            <th>Light</th>
            <th>Dark</th>
          </tr>
        </thead>
        <tbody>
          {COLOR_TOKENS.map((tok) => (
            <tr key={tok}>
              <td className="font-mono">{tok}</td>
              {[t.light[tok], t.dark[tok]].map((v, i) => (
                <td key={i}>
                  <span className="inline-flex items-center gap-2 font-mono text-[12px]">
                    <span className="inline-block size-4 border border-border" style={{ background: v }} />
                    {v}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
};

/** Links: the link colour, and the visited colour (the second link points at this page, so it is visited) */
export const Links: StoryObj = {
  render: () => (
    <p className="max-w-prose text-[14px]">
      Read <a href="https://example.com/never-visited-plainspoken" className="text-link underline visited:text-link-visited">a page you haven&apos;t seen</a> or{" "}
      <a href="" className="text-link underline visited:text-link-visited">
        this one, which you have
      </a>
      . Status: <span className="text-success">passed</span>, <span className="text-warning">needs attention</span>,{" "}
      <span className="text-destructive">failed</span>.
    </p>
  ),
};
