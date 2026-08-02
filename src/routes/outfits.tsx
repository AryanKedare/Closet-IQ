import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ScoreDots } from "@/components/ScoreDots";
import { OCCASION_FILTERS } from "@/lib/constants";
import { generateOutfitExplanation } from "@/lib/generateOutfitExplanation";
import { Wand2, Bookmark, Heart, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/outfits")({ component: OutfitsPage });

function OutfitsPage() {
  const navigate = useNavigate();
  const outfits = useStore((s) => s.outfits);
  const items = useStore((s) => s.items);
  const profile = useStore((s) => s.profile);
  const setExplanation = useStore((s) => s.setExplanation);
  const generate = useStore((s) => s.generate);
  const generating = useStore((s) => s.generating);
  const toggleSaved = useStore((s) => s.toggleSaved);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const markWorn = useStore((s) => s.markWorn);

  const [filter, setFilter] = useState<string>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  const getItem = (id: string | null) =>
    id ? items.find((i) => i.id === id) ?? null : null;

  const filtered = useMemo(() => {
    let list = outfits;
    if (showSavedOnly) list = list.filter((o) => o.isSaved);
    if (filter !== "All")
      list = list.filter((o) => o.occasionTags.includes(filter));
    return list;
  }, [outfits, filter, showSavedOnly]);

  async function explainAndOpen(outfitId: string) {
    const outfit = outfits.find((candidate) => candidate.id === outfitId);
    if (!outfit) return;

    setExplainingId(outfitId);
    setExplainError(null);

    try {
      await generateOutfitExplanation({
        outfit,
        top: getItem(outfit.topId),
        bottom: getItem(outfit.bottomId),
        shoes: getItem(outfit.shoesId),
        jacket: getItem(outfit.jacketId),
        profile,
        save: setExplanation,
        navigate: async (id) => {
          await navigate({
            to: "/outfits/$outfitId",
            params: { outfitId: id },
          });
        },
      });
    } catch (error) {
      setExplainError(
        error instanceof Error ? error.message : "Could not generate explanation",
      );
    } finally {
      setExplainingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outfits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {outfits.length} combinations generated • sorted by compatibility
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              showSavedOnly
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Bookmark className="h-4 w-4" />
            Saved
          </button>
          <button
            onClick={() => generate()}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {generating ? "Generating…" : "Regenerate"}
          </button>
        </div>
      </div>

      {explainError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Explanation failed: {explainError}
        </p>
      )}

      <div className="scrollbar-hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {OCCASION_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "All" ? f : f.replace("-", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-4 p-12 text-center">
          <Wand2 className="h-10 w-10 text-primary/60" />
          <div>
            <p className="font-semibold">No matching outfits</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {outfits.length === 0
                ? "Generate outfits from your closet — every valid pairing, scored mathematically."
                : "Try another occasion filter or regenerate."}
            </p>
          </div>
          {outfits.length === 0 && (
            <button
              onClick={() => generate()}
              disabled={generating}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate now"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const top = getItem(o.topId);
            const bottom = getItem(o.bottomId);
            const shoes = getItem(o.shoesId);
            const jacket = getItem(o.jacketId);
            const isExplaining = explainingId === o.id;

            return (
              <div key={o.id} className="card-surface flex flex-col p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Slot label="Top" item={top} />
                  <Slot label="Bottom" item={bottom} />
                  <Slot label="Shoes" item={shoes} />
                  <Slot label="Jacket" item={jacket} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <ScoreDots score={o.compatibilityScore} />
                  <div className="flex flex-wrap justify-end gap-1">
                    {o.occasionTags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                      >
                        {t.replace("-", " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <IconBtn
                      onClick={() => toggleSaved(o.id)}
                      label="Save"
                      active={o.isSaved}
                    >
                      <Bookmark
                        className={cn("h-4 w-4", o.isSaved && "fill-current")}
                      />
                    </IconBtn>
                    <IconBtn
                      onClick={() => toggleFavorite(o.id)}
                      label="Favorite"
                      active={o.isFavorite}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          o.isFavorite && "fill-current",
                        )}
                      />
                    </IconBtn>
                    <IconBtn onClick={() => markWorn(o.id)} label="Mark worn">
                      <CheckCircle2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                  <button
                    type="button"
                    onClick={() => void explainAndOpen(o.id)}
                    disabled={explainingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:cursor-wait disabled:opacity-60"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {isExplaining ? "Generating…" : "Why this works?"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Slot({ label, item }: { label: string; item: any }) {
  return (
    <div>
      <ItemImage item={item} />
      <p className="mt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="line-clamp-1 text-xs font-medium">{item?.name ?? "—"}</p>
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
