import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { generateOutfits } from "@/lib/outfitGenerator";
import { ItemImage } from "@/components/ItemImage";
import { ColorSwatch } from "@/components/ColorSwatch";
import { Luggage, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/types";

export const Route = createFileRoute("/pack")({ component: PackPage });

const OCCASIONS = ["casual", "smart-casual", "office", "date-night", "going-out"] as const;
type Occasion = (typeof OCCASIONS)[number];

interface PackForm {
  destination: string;
  days: number;
  occasions: Partial<Record<Occasion, number>>;
}

function pickPackingList(
  outfits: ReturnType<typeof generateOutfits>,
  allItems: WardrobeItem[],
  occasions: Partial<Record<Occasion, number>>
): { outfits: typeof outfits; items: WardrobeItem[] } {
  const itemMap = new Map(allItems.map((i) => [i.id, i]));

  const needed: typeof outfits = [];
  for (const [occ, count] of Object.entries(occasions) as [Occasion, number][]) {
    if (!count) continue;
    const matching = outfits
      .filter((o) => o.occasionTags.includes(occ))
      .slice(0, count);
    needed.push(...matching);
  }

  // dedupe outfit list
  const seen = new Set<string>();
  const deduped = needed.filter((o) => {
    if (seen.has(o.topId + o.bottomId)) return false;
    seen.add(o.topId + o.bottomId);
    return true;
  });

  // collect minimal item set
  const itemIds = new Set<string>();
  deduped.forEach((o) => {
    [o.topId, o.bottomId, o.shoesId, o.jacketId].filter(Boolean).forEach((id) => itemIds.add(id!));
  });

  const items = Array.from(itemIds)
    .map((id) => itemMap.get(id))
    .filter(Boolean) as WardrobeItem[];

  return { outfits: deduped, items };
}

function PackPage() {
  const items = useStore((s) => s.items);
  const outfits = useStore((s) => s.outfits);
  const profile = useStore((s) => s.profile);

  const [form, setForm] = useState<PackForm>({
    destination: "",
    days: 3,
    occasions: { casual: 2, "smart-casual": 1 },
  });
  const [result, setResult] = useState<ReturnType<typeof pickPackingList> | null>(null);

  const activeItems = useMemo(() => items.filter((i) => !i.isStored), [items]);

  const allOutfits = useMemo(() => {
    if (!profile) return outfits;
    return outfits.length > 0 ? outfits : generateOutfits(activeItems, profile);
  }, [outfits, activeItems, profile]);

  function handleBuild() {
    setResult(pickPackingList(allOutfits, activeItems, form.occasions));
  }

  const totalOutfits = Object.values(form.occasions).reduce((s, v) => s + (v ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trip Packer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell me where you're going and I'll build the smallest bag that covers every outfit.
        </p>
      </div>

      <section className="card-surface p-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Destination
            </label>
            <input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="e.g. Amsterdam, Barcelona…"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Days
            </label>
            <input
              type="number"
              min={1}
              max={14}
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How many outfits per occasion?
          </label>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {OCCASIONS.map((occ) => (
              <div key={occ} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm capitalize">{occ.replace("-", " ")}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm({ ...form, occasions: { ...form.occasions, [occ]: Math.max(0, (form.occasions[occ] ?? 0) - 1) } })}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                  >–</button>
                  <span className="w-4 text-center text-sm font-bold tabular-nums">{form.occasions[occ] ?? 0}</span>
                  <button
                    onClick={() => setForm({ ...form, occasions: { ...form.occasions, [occ]: (form.occasions[occ] ?? 0) + 1 } })}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleBuild}
          disabled={totalOutfits === 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Luggage className="h-4 w-4" />
          Build packing list
        </button>
      </section>

      {result && (
        <>
          <section className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {form.destination ? `Pack for ${form.destination}` : "Your pack"} — {form.days} days
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {result.outfits.length} outfits · {result.items.length} items total
                </p>
              </div>
              <button
                onClick={handleBuild}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reshuffle
              </button>
            </div>

            {/* Item grid */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Items to pack</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {result.items.map((item) => (
                  <div key={item.id} className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-md overflow-hidden border border-border">
                      <ItemImage item={item} />
                    </div>
                    <p className="text-center text-[10px] font-medium line-clamp-2 text-muted-foreground">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Outfits from pack */}
          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Outfits in your pack</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {result.outfits.map((o, idx) => {
                const itemMap = new Map(activeItems.map((i) => [i.id, i]));
                const top = o.topId ? itemMap.get(o.topId) : null;
                const bottom = o.bottomId ? itemMap.get(o.bottomId) : null;
                const shoes = o.shoesId ? itemMap.get(o.shoesId) : null;
                const jacket = o.jacketId ? itemMap.get(o.jacketId) : null;
                return (
                  <div key={idx} className="card-surface p-4">
                    <div className="mb-2 flex flex-wrap gap-1">
                      {o.occasionTags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                          {t.replace("-", " ")}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[{ l: "Top", i: top }, { l: "Bottom", i: bottom }, { l: "Shoes", i: shoes }, { l: "Layer", i: jacket }].map(({ l, i }) => (
                        <div key={l}>
                          <ItemImage item={i} />
                          <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{l}</p>
                          <p className="line-clamp-1 text-[10px] font-medium">{i?.name ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {result.outfits.length === 0 && (
            <div className="card-surface flex items-center gap-3 p-5">
              <Luggage className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No outfits found for those occasions. Try generating outfits first.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
