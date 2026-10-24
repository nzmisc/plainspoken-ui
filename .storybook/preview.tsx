import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { useEffect, useState, type PropsWithChildren } from "react";
import { themes } from "storybook/theming";
import "../app/globals.css";
import "./fonts.css";

/** Toolbar switches, applied to <html> the way the site does: the .dark class, and a control size for the whole canvas. */
const withLook: Decorator = (Story, ctx) => {
  const { theme, size } = ctx.globals as { theme?: string; size?: string };
  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  const ctl = size && size !== "inherit" ? `ctl-${size}` : undefined;
  return ctl ? (
    <div className={ctl}>
      <Story />
    </div>
  ) : (
    <Story />
  );
};

const isDark = () => document.documentElement.classList.contains("dark");

/** The docs pages in the same scheme as the components on them (Storybook draws its docs light otherwise). */
function ThemedDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return <DocsContainer {...props} theme={dark ? themes.dark : themes.light} />;
}

const preview: Preview = {
  decorators: [withLook],
  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "auto", title: "Follow OS" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    size: {
      description: "Control size for everything that doesn't set its own",
      toolbar: {
        title: "Size",
        icon: "ruler",
        items: [
          { value: "inherit", title: "Size: default (md)" },
          { value: "xs", title: "xs 20px" },
          { value: "sm", title: "sm 24px" },
          { value: "md", title: "md 28px" },
          { value: "lg", title: "lg 36px" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "auto", size: "inherit" },
  parameters: {
    options: {
      storySort: {
        order: [
          "Introduction",
          "Foundations",
          ["Introduction", "Colours", "Control sizes", "Icons", "*"],
          "Components",
          ["Controls", "Forms", "Feedback", "Overlays", "Navigation", "Data display", "Layout", "Typography", "Charts", "*"],
          "Blocks",
          "Demos",
          "*",
        ],
      },
    },
    layout: "padded",
    docs: { container: ThemedDocsContainer },
    controls: { expanded: true },
    backgrounds: { disable: true },
    nextjs: { appDirectory: true },
    viewport: {
      options: {
        iphoneSE: { name: "iPhone SE (375)", styles: { width: "375px", height: "667px" }, type: "mobile" },
        iphone: { name: "iPhone 16 (393)", styles: { width: "393px", height: "852px" }, type: "mobile" },
        ipad: { name: "iPad (820)", styles: { width: "820px", height: "1180px" }, type: "tablet" },
        laptop: { name: "Laptop (1366)", styles: { width: "1366px", height: "800px" }, type: "desktop" },
      },
    },
  },
  tags: ["autodocs"],
};
export default preview;
