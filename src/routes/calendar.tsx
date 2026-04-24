import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

function CalendarPage() {
  const history = useStore((s) => s.history);
  const outfits = useStore((s) => s.outfits);
  const items = useStore((s) => s.items);
  const deleteHistory = useStore((s) => s.deleteHistory);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const outfitMap = useMemo(() => new Map(outfits.map((o) => [o.id, o])), [outfits]);

  // Map wornDate -> outfit (last one if multiple)
  const dayMap = useMemo(() => {
    const m = new Map<string, typeof history[0]>();
    [...history].reverse().forEach((h) => {
      if (h.wornDate) m.set(h.wornDate, h);
    });
    return m;
  }, [history]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = (firstDow + 6) % 7; // Mon-start

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month, 1).toLocaleDateString("en-IE", { month: "long", year: "numeric" });

  // Stats for the month
  const monthStats = useMemo(() => {
    const wornDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const mo = String(month + 1).padStart(2, "0");
      return `${year}-${mo}-${d}`;
    }).filter((date) => dayMap.has(date));

    const usedOutfitIds = new Set(wornDays.map((d) => dayMap.get(d)!.outfitId));
    const usedItems = new Set<string>();
    usedOutfitIds.forEach((id) => {
      const o = outfitMap.get(id ?? "");
      if (!o) return;
      [o.topId, o.bottomId, o.shoesId, o.jacketId].filter(Boolean).forEach((x) => usedItems.add(x!));
    });

    return { wornCount: wornDays.length, uniqueOutfits: usedOutfitIds.size, uniqueItems: usedItems.size };
  }, [daysInMonth, month, year, dayMap, outfitMap]);

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wear Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every day you tracked an outfit</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-4">
        <button onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold">{monthName}</h2>
        <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Days tracked" value={monthStats.wornCount} />
        <Stat label="Unique outfits" value={monthStats.uniqueOutfits} />
        <Stat label="Items used" value={monthStats.uniqueItems} />
      </div>

      {/* Calendar grid */}
      <div className="card-surface p-4">
        <div className="mb-2 grid grid-cols-7 text-center">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const mo = String(month + 1).padStart(2, "0");
            const dy = String(day).padStart(2, "0");
            const dateStr = `${year}-${mo}-${dy}`;
            const histEntry = dayMap.get(dateStr);
            const outfit = histEntry ? outfitMap.get(histEntry.outfitId ?? "") : null;
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

            return (
              <div
                key={idx}
                className={cn(
                  "relative aspect-square rounded-md overflow-hidden",
                  outfit ? "ring-1 ring-primary/30" : "bg-muted/30",
                  isToday && "ring-2 ring-primary"
                )}
              >
                {outfit ? (
                  <Link to="/outfits/$outfitId" params={{ outfitId: outfit.id }} className="block h-full w-full">
                    <div className="grid grid-cols-2 h-full">
                      {[outfit.topId, outfit.bottomId, outfit.shoesId, outfit.jacketId].map((id, i) => (
                        <div key={i} className="overflow-hidden">
                          <ItemImage item={id ? itemMap.get(id) : null} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5">
                      <p className="text-[9px] font-bold text-white text-center">{day}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex h-full items-start justify-end p-1">
                    <span className={cn("text-[10px] font-medium", isToday ? "text-primary" : "text-muted-foreground/60")}>
                      {day}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent entries */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Recent wears</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((h) => {
              const o = outfitMap.get(h.outfitId ?? "");
              if (!o) return null;
              return (
                <div key={h.id} className="card-surface flex items-center gap-4 p-3">
                  <Link
                    to="/outfits/$outfitId"
                    params={{ outfitId: o.id }}
                    className="flex flex-1 items-center gap-4 min-w-0"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-14 h-14 flex-shrink-0 rounded overflow-hidden">
                      {[o.topId, o.bottomId, o.shoesId, o.jacketId].map((id, i) => (
                        <div key={i} className="overflow-hidden">
                          <ItemImage item={id ? itemMap.get(id) : null} />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {new Date(h.wornDate).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {h.occasion ? h.occasion.replace("-", " ") : o.occasionTags[0]?.replace("-", " ") ?? ""}
                      </p>
                    </div>
                    {h.rating && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1, 2, 3].map((s) => (
                          <span key={s} className={cn("text-sm", s <= h.rating! ? "text-amber-400" : "text-muted-foreground/30")}>★</span>
                        ))}
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => deleteHistory(h.id)}
                    aria-label="Delete from history"
                    className="flex-shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
