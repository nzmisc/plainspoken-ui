import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Snowflake, Sun, type Glyph } from "@/registry/plainspoken/lib/icons";
import type { ChatWeather } from "@/registry/plainspoken/blocks/chat/data";
import { ChatToolCard, type ChatToolState } from "@/registry/plainspoken/blocks/chat/tool-card";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

/** What a WMO weather code (as open-meteo sends) means, and its icon by day and by night */
export function weatherCondition(code: number, isDay = true): { text: string; icon: Glyph } {
  if (code === 0) return { text: isDay ? "Clear sky" : "Clear", icon: isDay ? Sun : Moon };
  if (code === 1) return { text: "Mainly clear", icon: isDay ? CloudSun : CloudMoon };
  if (code === 2) return { text: "Partly cloudy", icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { text: "Overcast", icon: Cloud };
  if (code === 45 || code === 48) return { text: "Fog", icon: CloudFog };
  if (code >= 51 && code <= 57) return { text: code >= 56 ? "Freezing drizzle" : "Drizzle", icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { text: code >= 66 ? "Freezing rain" : code === 65 ? "Heavy rain" : code === 61 ? "Light rain" : "Rain", icon: CloudRain };
  if (code >= 71 && code <= 77) return { text: code === 77 ? "Snow grains" : code === 75 ? "Heavy snow" : "Snow", icon: Snowflake };
  if (code >= 80 && code <= 82) return { text: code === 82 ? "Heavy showers" : "Rain showers", icon: CloudRain };
  if (code === 85 || code === 86) return { text: "Snow showers", icon: CloudSnow };
  if (code >= 95) return { text: code === 95 ? "Thunderstorm" : "Thunderstorm with hail", icon: CloudLightning };
  return { text: "Unknown", icon: Cloud };
}

const round = (n: number) => (Number.isFinite(n) ? Math.round(n) : "–");

/** "Sun 25" from "2026-10-25", the same on the server and in any time zone */
function dayName(iso: string, first: boolean): string {
  if (first) return "Today";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" });
}

export interface ChatWeatherCardProps {
  /** The city the model asked about, shown while it runs */
  city?: string;
  state: ChatToolState | (string & {});
  /** The weather tool's answer */
  weather?: ChatWeather;
  errorText?: string;
  className?: string;
}

/**
 * The weather tool's call in an answer: "Weather in Lisbon" with a spinner while it runs, then the
 * weather now (the condition with its icon, the temperature large, what it feels like, humidity
 * and wind) over the next five days in a row of cells, with the chance of rain. A failed lookup
 * says why. Figures come from open-meteo.com, in its units (°C, km/h).
 */
export function ChatWeatherCard({ city, state, weather, errorText, className }: ChatWeatherCardProps) {
  const place = weather ? [weather.place.name, weather.place.region !== weather.place.name ? weather.place.region : undefined, weather.place.country].filter(Boolean).join(", ") : city;
  const done = state === "output-available" && weather;
  const now = done ? weatherCondition(weather.current.code, weather.current.isDay) : null;
  const t = weather?.units.temperature ?? "°C";
  return (
    <ChatToolCard
      name="getWeather"
      title={place ? `Weather in ${place}` : "Weather"}
      state={state}
      errorText={errorText}
      icon={now?.icon ?? CloudSun}
      hideDetails
      className={cn("max-w-xl", className)}
    >
      {done && now && (
        <div data-slot="chat-weather-card">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
            <Icon icon={now.icon} size={36} strokeWidth={1.5} className="text-muted-foreground" />
            <p className="text-[32px] leading-none font-bold tabular-nums">
              {round(weather.current.temperature)}
              <span className="text-[18px] font-semibold text-muted-foreground">{t}</span>
            </p>
            <div className="min-w-0 text-[13px]">
              <p className="font-semibold">{now.text}</p>
              <p className="text-muted-foreground tabular-nums">
                Feels like {round(weather.current.feelsLike)}
                {t} · Humidity {round(weather.current.humidity)}% · Wind {round(weather.current.wind)} {weather.units.wind}
              </p>
            </div>
          </div>
          {weather.daily.length > 0 && (
            <ol aria-label="The next days" className="grid grid-cols-5 border-t border-border text-center text-[12px]">
              {weather.daily.map((d, i) => {
                const c = weatherCondition(d.code);
                return (
                  <li key={d.date} className={cn("flex flex-col items-center gap-0.5 px-1 py-1.5", i > 0 && "border-l border-border")}>
                    <span className="font-semibold">{dayName(d.date, i === 0)}</span>
                    <Icon icon={c.icon} size={18} label={c.text} className="text-muted-foreground" />
                    <span className="tabular-nums">
                      <span className="font-semibold">{round(d.max)}°</span> <span className="text-muted-foreground">{round(d.min)}°</span>
                    </span>
                    {d.rain != null && <span className="text-muted-foreground tabular-nums">{round(d.rain)}% rain</span>}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="border-t border-border px-3 py-1 text-[11px] text-muted-foreground">Forecast from open-meteo.com</p>
        </div>
      )}
    </ChatToolCard>
  );
}
