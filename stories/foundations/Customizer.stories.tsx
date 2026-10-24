import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Customizer } from "@/components/site/customizer/customizer";

/**
 * The theme customizer from the docs site's /customize page: base gray, main colour, link colours
 * and fonts; a preview made of the real components; a contrast report; and the CSS, shadcn command
 * and font lines that make the theme yours. The theme is applied to the preview only, as CSS
 * variables on its container, so the rest of the canvas keeps the Theme toolbar's look.
 *
 * Here the choices aren't written to the address (the page keeps them there, so a theme is a link),
 * and only Geist and Geist Mono are loaded: the other fonts show if they are installed on your
 * machine, and otherwise fall back to the system fonts. The page loads them all.
 *
 * Keyboard: the swatches are native radios (Tab into a group, arrows to choose), the fonts are native
 * selects, and the custom colours take hex typed in or the browser's colour picker.
 */
const meta: Meta<typeof Customizer> = {
  title: "Foundations/Customizer",
  component: Customizer,
  parameters: { layout: "padded" },
  args: { syncUrl: false },
};
export default meta;

export const Default: StoryObj<typeof Customizer> = {};
