import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatWeatherCard } from "@/registry/plainspoken/blocks/chat/weather-card";
import { SHOWCASE_WEATHER } from "@/registry/plainspoken/blocks/chat/showcase";

const meta: Meta<typeof ChatWeatherCard> = {
  title: "Blocks/AI chat/Weather card",
  component: ChatWeatherCard,
  args: { city: "Brighton, UK", state: "output-available", weather: SHOWCASE_WEATHER },
};
export default meta;
type Story = StoryObj<typeof ChatWeatherCard>;

/** The weather now and the next five days, from Open-Meteo. */
export const Done: Story = {};

/** Looking it up. */
export const Running: Story = { args: { state: "input-available", weather: undefined } };

/** No such place, or the service didn't answer. */
export const Failed: Story = { args: { city: "Atlantis", state: "output-error", weather: undefined, errorText: "No place called “Atlantis” was found." } };
