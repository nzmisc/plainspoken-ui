import type { StorybookConfig } from "@storybook/nextjs-vite";
import remarkGfm from "remark-gfm";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.tsx"],
  addons: [
    // GitHub-flavored Markdown in the .mdx pages: tables, strikethrough, task lists, autolinks.
    { name: "@storybook/addon-docs", options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    "@storybook/addon-a11y",
  ],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  core: { disableTelemetry: true },
  // The built Storybook is served by the site at /storybook/, so every URL in it is relative.
  async viteFinal(cfg) {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return { ...cfg, base: "./", plugins: [...(cfg.plugins ?? []), tailwindcss()] };
  },
};
export default config;
