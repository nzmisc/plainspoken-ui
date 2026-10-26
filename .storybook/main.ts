import type { StorybookConfig } from "@storybook/nextjs-vite";
import remarkGfm from "remark-gfm";

// The site's .env.local, for DEV_HOSTS (Next.js reads it by itself; Storybook doesn't)
try {
  process.loadEnvFile(".env.local");
} catch {}
const devHosts = () => (process.env.DEV_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.tsx"],
  addons: [
    // GitHub-flavored Markdown in the .mdx pages: tables, strikethrough, task lists, autolinks.
    { name: "@storybook/addon-docs", options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    "@storybook/addon-a11y",
  ],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  // allowedHosts: other hostnames the dev Storybook is reached by, as for the site (DEV_HOSTS)
  core: { disableTelemetry: true, allowedHosts: devHosts() },
  // The built Storybook is served by the site at /storybook/, so every URL in it is relative.
  async viteFinal(cfg) {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return { ...cfg, base: "./", plugins: [...(cfg.plugins ?? []), tailwindcss()] };
  },
};
export default config;
