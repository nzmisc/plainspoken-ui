import { ChatWeatherCard } from "@/registry/plainspoken/blocks/chat/weather-card";
import { SHOWCASE_WEATHER } from "@/registry/plainspoken/blocks/chat/showcase";

/** The weather tool's answer, from Open-Meteo: now, and the next five days. Then while it runs, and when it fails. */
export default function ChatWeatherCardDemo() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <ChatWeatherCard city="Brighton, UK" state="output-available" weather={SHOWCASE_WEATHER} />
      <ChatWeatherCard city="Lisbon" state="input-available" />
      <ChatWeatherCard city="Atlantis" state="output-error" errorText="No place called “Atlantis” was found." />
    </div>
  );
}
