import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ScoreDots } from "@/components/ScoreDots";
import { Wand2, Cloud, Sun, CloudRain, Snowflake, Wind, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/today")({ component: TodayPage });

interface Weather {
  temp: number;
  code: number;
  wind: number;
  description: string;
}

function wmoDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Rain showers";
  return "Stormy";
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const cls = cn("h-10 w-10", className);
  if (code === 0) return <Sun className={cn(cls, "text-amber-400")} />;
  if (code <= 3) return <Cloud className={cn(cls, "text-slate-400")} />;
  if (code <= 77) return <CloudRain className={cn(cls, "text-blue-400")} />;
  if (code <= 77) return <Snowflake className={cn(cls, "text-sky-300")} />;
  return <Wind className={cn(cls, "text-slate-400")} />;
}

async function fetchDublinWeather(): Promise<Weather> {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603&current=temperature_2m,weathercode,windspeed_10m&timezone=Europe/Dublin"
  );
  const json = await res.json();
  const { temperature_2m, weathercode, windspeed_10m } = json.current;
  return {
    temp: Math.round(temperature_2m),
    code: weathercode,
    wind: Math.round(windspeed_10m),
    description: wmoDescription(weathercode),
  };
}

function scoreForWeather(w: Weather, outfit: any, itemMap: Map<string, any>): number {
  const top = itemMap.get(outfit.topId);
  const jacket = itemMap.get(outfit.jacketId);
  let bonus = 0;

  // Cold (<10°C) — bonus for having a jacket
  if (w.temp < 10 && jacket) bonus += 15;
  if (w.temp < 10 && !jacket) bonus -= 20;

  // Rainy/stormy — slight penalty for no jacket
  if (w.code >= 51 && w.code <= 82 && !jacket) bonus -= 10;

  // Warm (>18°C) — light fabrics preferred
  if (w.temp > 18 && top && /linen|cotton/i.test(top.name)) bonus += 8;

  // Very hot (>22°C) — shorts allowed
  if (w.temp > 22) {
    const bottom = itemMap.get(outfit.bottomId);
    if (bottom?.category === "shorts") bonus += 10;
  }

  return outfit.compatibilityScore + bonus;
}

function TodayPage() {
  const outfits = useStore((s) => s.outfits);
  const items = useStore((s) => s.items);
  const history = useStore((s) => s.history);
  const markWorn = useStore((s) => s.markWorn);
  const generate = useStore((s) => s.generate);
  const generating = useStore((s) => s.generating);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    fetchDublinWeather()
      .then(setWeather)
      .catch(() => setWeatherError(true))
      .finally(() => setWeatherLoading(false));
  }, []);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // IDs worn in last 7 days
  const recentlyWornIds = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Set(
      history
        .filter((h) => new Date(h.wornDate).getTime() > cutoff)
        .map((h) => h.outfitId)
    );
  }, [history]);

  const pick = useMemo(() => {
    if (!weather) return null;
    const candidates = outfits.filter((o) => !recentlyWornIds.has(o.id));
    const pool = candidates.length > 0 ? candidates : outfits;
    if (pool.length === 0) return null;
    return [...pool].sort(
      (a, b) => scoreForWeather(weather, b, itemMap) - scoreForWeather(weather, a, itemMap)
    )[0];
  }, [outfits, weather, recentlyWornIds, itemMap]);

  const top = pick ? itemMap.get(pick.topId) : null;
  const bottom = pick ? itemMap.get(pick.bottomId) : null;
  const shoes = pick ? itemMap.get(pick.shoesId) : null;
  const jacket = pick ? itemMap.get(pick.jacketId) : null;

  const today = new Date().toLocaleDateString("en-IE", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">What to wear today</h1>
      </div>

      {/* Weather card */}
      <section className="card-surface p-5">
        {weatherLoading ? (
          <p className="text-sm text-muted-foreground">Fetching Dublin weather…</p>
        ) : weatherError ? (
          <p className="text-sm text-muted-foreground">Could not fetch weather. Showing best overall pick.</p>
        ) : weather ? (
          <div className="flex items-center gap-5">
            <WeatherIcon code={weather.code} />
            <div>
              <p className="text-3xl font-bold tabular-nums">{weather.temp}°C</p>
              <p className="text-sm text-muted-foreground">{weather.description} · {weather.wind} km/h wind · Dublin</p>
            </div>
            <div className="ml-auto text-right text-xs text-muted-foreground">
              {weather.temp < 10 && <p className="font-medium text-blue-500">Layer up — it's cold</p>}
              {weather.temp > 18 && <p className="font-medium text-amber-500">Light fabrics day</p>}
              {weather.code >= 51 && weather.code <= 82 && <p className="font-medium text-sky-500">Rain likely</p>}
            </div>
          </div>
        ) : null}
      </section>

      {/* Pick */}
      {pick ? (
        <section className="card-surface p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Today's pick</p>
              <p className="mt-0.5 font-semibold text-lg">
                {pick.name || pick.occasionTags.slice(0, 2).map((t) => t.replace("-", " ")).join(" · ")}
              </p>
            </div>
            <ScoreDots score={pick.compatibilityScore} />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Top", item: top },
              { label: "Bottom", item: bottom },
              { label: "Shoes", item: shoes },
              { label: "Layer", item: jacket },
            ].map(({ label, item }) => (
              <div key={label}>
                <ItemImage item={item} />
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="line-clamp-1 text-xs font-medium">{item?.name ?? "—"}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {!marked ? (
              <button
                onClick={() => { markWorn(pick.id); setMarked(true); }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Wearing this today
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Marked as worn
              </div>
            )}
            <Link
              to="/outfits/$outfitId"
              params={{ outfitId: pick.id }}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View detail
            </Link>
          </div>
        </section>
      ) : (
        <section className="card-surface flex flex-col items-center gap-4 p-12 text-center">
          <Wand2 className="h-10 w-10 text-primary/60" />
          <div>
            <p className="font-semibold">No outfits generated yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Generate outfits first to get a daily pick.</p>
          </div>
          <button
            onClick={() => generate()}
            disabled={generating}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate outfits"}
          </button>
        </section>
      )}

      {/* Alternatives */}
      {pick && outfits.length > 1 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Other options today</h2>
            <button
              onClick={() => generate()}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} />
              Regenerate
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {outfits
              .filter((o) => o.id !== pick.id)
              .slice(0, 8)
              .map((o) => (
                <Link
                  key={o.id}
                  to="/outfits/$outfitId"
                  params={{ outfitId: o.id }}
                  className="card-surface p-3"
                >
                  <div className="grid grid-cols-2 gap-1">
                    {[o.topId, o.bottomId, o.shoesId, o.jacketId].map((id, i) => (
                      <div key={i} className="aspect-square">
                        <ItemImage item={id ? itemMap.get(id) : null} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <ScoreDots score={o.compatibilityScore} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground capitalize">
                    {o.occasionTags[0]?.replace("-", " ")}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
