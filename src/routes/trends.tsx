import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { TrendingUp, CheckCircle2, Circle } from "lucide-react";
import type { WardrobeItem } from "@/lib/types";

export const Route = createFileRoute("/trends")({ component: TrendsPage });

interface Trend {
  name: string;
  description: string;
  season: string;
  matchKeywords: string[];
  matchCategories: string[];
  matchColorFamilies: string[];
  tip: string;
}

const TRENDS_2026: Trend[] = [
  {
    name: "Quiet Luxury",
    season: "Spring/Summer 2026",
    description: "Understated, elevated basics. No logos, premium fabrics, tonal colour stories in camel, cream, and navy.",
    matchKeywords: ["linen", "cream", "oxford", "minimal"],
    matchCategories: ["shirt", "pants"],
    matchColorFamilies: ["cream", "neutral", "cool-blue"],
    tip: "Pair your linen shirts with clean chinos for peak quiet luxury. The key is tonal — avoid mixing too many colour families.",
  },
  {
    name: "Workwear Revival",
    season: "Spring/Summer 2026",
    description: "Utility-inspired pieces — cargo details, structured outerwear, and earthy tones crossing into everyday wear.",
    matchKeywords: ["cargo", "utility", "structured", "khaki"],
    matchCategories: ["pants", "jacket"],
    matchColorFamilies: ["warm-earth", "neutral"],
    tip: "Cargo trousers with a clean white or cream shirt is the modern take — keep everything else minimal.",
  },
  {
    name: "Denim on Denim",
    season: "Spring/Summer 2026",
    description: "The Canadian tuxedo is back, but done right — different washes, matching the denim weight.",
    matchKeywords: ["denim", "jeans"],
    matchCategories: ["jeans", "jacket"],
    matchColorFamilies: ["cool-blue", "grey"],
    tip: "The rule: top and bottom denim must differ in wash by at least 2 shades. Light wash jeans + dark denim jacket, or vice versa.",
  },
  {
    name: "Camp Collar Shirts",
    season: "Spring/Summer 2026",
    description: "Open-collar resort shirts — linen, seersucker, or bold prints — worn open over a tee or buttoned up.",
    matchKeywords: ["camp", "resort", "seersucker", "striped"],
    matchCategories: ["shirt"],
    matchColorFamilies: ["warm-earth", "cream", "warm-pink"],
    tip: "Wear yours open over a plain white tee with white trainers. The contrast collar does the work.",
  },
  {
    name: "Tonal Dressing",
    season: "Spring/Summer 2026",
    description: "Head-to-toe outfits in the same colour family, varying only in shade and texture.",
    matchKeywords: [],
    matchCategories: [],
    matchColorFamilies: ["dark", "warm-earth", "cream"],
    tip: "Your brown leather jacket with camel or earth-tone bottoms is a perfect tonal set. Add depth with texture contrast.",
  },
  {
    name: "Clean Sneaker Culture",
    season: "2026 Ongoing",
    description: "Low-profile minimalist trainers replacing chunky soles. Killshots, Palermo, and clean court shoes dominate.",
    matchKeywords: ["killshot", "palermo", "clean", "court"],
    matchCategories: ["shoes"],
    matchColorFamilies: ["neutral", "cream", "dark"],
    tip: "A clean white trainer instantly elevates any outfit. Keep them clean — scuffs break the minimal aesthetic.",
  },
  {
    name: "Brown Leather Everywhere",
    season: "Autumn/Winter 2025–26",
    description: "Brown leather in tan, cognac, and chocolate is the neutral of the moment, replacing black leather as the go-to.",
    matchKeywords: ["leather", "brown", "tan", "cognac"],
    matchCategories: ["jacket"],
    matchColorFamilies: ["warm-earth"],
    tip: "Your brown leather jacket is perfectly on-trend. Pair it with cream or rust tones for maximum impact.",
  },
];

function matchTrend(trend: Trend, items: WardrobeItem[]): WardrobeItem[] {
  return items.filter((item) => {
    const nameMatch = trend.matchKeywords.some((kw) =>
      item.name.toLowerCase().includes(kw.toLowerCase()) ||
      (item.styleTags ?? []).some((t) => t.toLowerCase().includes(kw.toLowerCase()))
    );
    const catMatch = trend.matchCategories.includes(item.category);
    const colorMatch = trend.matchColorFamilies.includes(item.colorFamily);
    return nameMatch || (catMatch && colorMatch);
  });
}

function TrendsPage() {
  const items = useStore((s) => s.items);
  const activeItems = useMemo(() => items.filter((i) => !i.isStored), [items]);

  const trendMatches = useMemo(() =>
    TRENDS_2026.map((t) => ({ trend: t, matches: matchTrend(t, activeItems) })),
    [activeItems]
  );

  const covered = trendMatches.filter((t) => t.matches.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trending Now</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spring/Summer 2026 key trends — matched to your wardrobe
        </p>
      </div>

      <div className="card-surface p-5 flex items-center gap-4">
        <TrendingUp className="h-8 w-8 text-primary flex-shrink-0" />
        <div>
          <p className="font-semibold text-lg">
            You're on trend for {covered} of {TRENDS_2026.length} looks
          </p>
          <p className="text-sm text-muted-foreground">
            {covered >= 5 ? "Your wardrobe is very current." : covered >= 3 ? "Solid trend coverage — a few additions would nail the rest." : "Room to grow — see the tips below."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {trendMatches.map(({ trend, matches }) => (
          <section key={trend.name} className="card-surface p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {matches.length > 0
                  ? <CheckCircle2 className="h-5 w-5 text-primary" />
                  : <Circle className="h-5 w-5 text-muted-foreground/40" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold">{trend.name}</h2>
                  <span className="text-[11px] text-muted-foreground">{trend.season}</span>
                  {matches.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {matches.length} item{matches.length !== 1 ? "s" : ""} match
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{trend.description}</p>

                {matches.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Your matching items</p>
                    <div className="flex flex-wrap gap-2">
                      {matches.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                          <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0">
                            <ItemImage item={item} />
                          </div>
                          <span className="text-xs font-medium max-w-[100px] truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Styling tip:</span> {trend.tip}
                  </p>
                </div>

                {matches.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    You don't have exact matches yet. Check the Gap Advisor for purchase ideas.
                  </p>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
