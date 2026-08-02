import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ScoreDots } from "@/components/ScoreDots";
import { ColorSwatch } from "@/components/ColorSwatch";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Bookmark,
  Heart,
  Pencil,
  Check,
} from "lucide-react";
import { streamExplanation } from "@/lib/groqExplainer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/outfits/$outfitId")({
  component: OutfitDetail,
  notFoundComponent: () => (
    <div className="card-surface mx-auto mt-12 max-w-md p-8 text-center">
      <p className="font-semibold">Outfit not found</p>
      <Link
        to="/outfits"
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to outfits
      </Link>
    </div>
  ),
});

function OutfitDetail() {
  const { outfitId } = Route.useParams();
  const outfits = useStore((s) => s.outfits);
  const items = useStore((s) => s.items);
  const profile = useStore((s) => s.profile);
  const setExplanation = useStore((s) => s.setExplanation);
  const renameOutfit = useStore((s) => s.renameOutfit);
  const rateWear = useStore((s) => s.rateWear);
  const markWorn = useStore((s) => s.markWorn);
  const toggleSaved = useStore((s) => s.toggleSaved);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const history = useStore((s) => s.history);

  const outfit = outfits.find((o) => o.id === outfitId);

  const [streaming, setStreaming] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(outfit?.name ?? "");
  const [wornRating, setWornRating] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);

  if (!outfit) throw notFound();

  const get = (id?: string | null) =>
    id ? items.find((x) => x.id === id) ?? null : null;

  const top = get(outfit.topId);
  const bottom = get(outfit.bottomId);
  const shoes = get(outfit.shoesId);
  const jacket = get(outfit.jacketId);

  const allItems = [top, bottom, shoes, jacket].filter(
    Boolean,
  ) as NonNullable<typeof top>[];

  const similar = useMemo(() => {
    return outfits
      .filter(
        (o) =>
          o.id !== outfit.id &&
          Math.abs(o.compatibilityScore - outfit.compatibilityScore) <= 8,
      )
      .slice(0, 6);
  }, [outfits, outfit.id, outfit.compatibilityScore]);

  async function handleExplain() {
    if (!profile || !top || !bottom || !shoes) {
      setError("Missing outfit or profile data for explanation");
      return;
    }

    if (outfit?.aiExplanation) {
      setStreamed(outfit.aiExplanation);
      return;
    }

    setStreaming(true);
    setError(null);
    setStreamed("");

    console.log("explain inputs", {
      top,
      bottom,
      shoes,
      jacket,
      profile,
    });

    let full = "";

    await streamExplanation({
      top,
      bottom,
      shoes,
      jacket,
      profile,
      onDelta: (c) => {
        full += c;
        setStreamed((prev) => prev + c);
      },
      onDone: async () => {
        setStreaming(false);
        if (full && outfit) await setExplanation(outfit.id, full);
      },
      onError: (e) => {
        setStreaming(false);
        setError(`Explanation failed: ${e}`);
      },
    });
  }

  const showExplanation = streamed || outfit.aiExplanation;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/outfits"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Outfits
        </Link>

        <div className="flex flex-1 items-center justify-center gap-1">
          {editingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                renameOutfit(outfit.id, nameInput.trim());
                setEditingName(false);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Name this outfit"
                className="rounded border border-primary bg-card px-2 py-1 text-sm focus:outline-none"
              />
              <button type="submit" className="text-primary">
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setNameInput(outfit.name ?? "");
                setEditingName(true);
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <span className="font-medium">{outfit.name || "Name this outfit"}</span>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => toggleSaved(outfit.id)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border",
              outfit.isSaved
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            <Bookmark
              className={cn("h-4 w-4", outfit.isSaved && "fill-current")}
            />
          </button>
          <button
            onClick={() => toggleFavorite(outfit.id)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border",
              outfit.isFavorite
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            <Heart
              className={cn("h-4 w-4", outfit.isFavorite && "fill-current")}
            />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Items</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Slot label="Top" item={top} />
              <Slot label="Bottom" item={bottom} />
              <Slot label="Shoes" item={shoes} />
              <Slot label="Jacket" item={jacket} />
            </div>
          </div>

          <div className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Compatibility
              </p>
              <div className="mt-1.5">
                <ScoreDots
                  score={outfit.compatibilityScore}
                  className="text-base"
                />
              </div>
            </div>

            {!showRating ? (
              <button
                onClick={async () => {
                  await markWorn(outfit.id);
                  setShowRating(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as worn today
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs text-muted-foreground">How did it feel?</p>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => {
                    const labels = ["Didn't feel it", "Pretty good", "Loved it"];
                    const latestHistory = history.find((h) => h.outfitId === outfit.id);
                    return (
                      <button
                        key={s}
                        title={labels[s - 1]}
                        onClick={() => {
                          setWornRating(s);
                          if (latestHistory) rateWear(latestHistory.id, s);
                        }}
                        className={cn(
                          "text-2xl transition-transform hover:scale-110",
                          wornRating === s
                            ? "text-amber-400"
                            : "text-muted-foreground/30",
                        )}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                {wornRating ? (
                  <p className="text-[11px] font-medium text-primary">
                    {
                      [
                        "",
                        "Noted — we'll adjust future picks",
                        "Nice one!",
                        "Perfect — more like this",
                      ][wornRating]
                    }
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Why this works?</h3>
              </div>

              {!showExplanation && (
                <button
                  onClick={handleExplain}
                  disabled={streaming || !profile || !top || !bottom || !shoes}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {streaming ? "Thinking…" : "Generate explanation"}
                </button>
              )}
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}

            {showExplanation ? (
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {showExplanation}
                {streaming && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary" />
                )}
              </p>
            ) : (
              !streaming &&
              !error && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tap to get a tailored breakdown of color harmony, contrast, and
                  how this combination reads against warm medium skin.
                </p>
              )
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Color harmony
            </p>
            <div className="mt-4 flex justify-center">
              <ColorWheel hexes={allItems.map((i) => i.primaryColor)} />
            </div>
            <div className="mt-4 space-y-2">
              {allItems.map((it) => (
                <div key={it.id} className="flex items-center gap-2 text-xs">
                  <ColorSwatch hex={it.primaryColor} size={14} />
                  <span className="text-muted-foreground">{it.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Similar combinations
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {similar.map((o) => (
              <Link
                key={o.id}
                to="/outfits/$outfitId"
                params={{ outfitId: o.id }}
                className="card-surface p-3"
              >
                <div className="grid grid-cols-2 gap-1">
                  {[get(o.topId), get(o.bottomId), get(o.shoesId), get(o.jacketId)].map(
                    (it, i) => (
                      <div key={i} className="aspect-square">
                        <ItemImage item={it} />
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2">
                  <ScoreDots score={o.compatibilityScore} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Slot({ label, item }: { label: string; item: any }) {
  return (
    <div>
      <ItemImage item={item} />
      <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="line-clamp-1 text-sm font-medium">{item?.name ?? "—"}</p>
      {item && (
        <div className="mt-1 flex items-center gap-1.5">
          <ColorSwatch hex={item.primaryColor} size={10} />
          <span className="text-[10px] text-muted-foreground">
            {item.colorFamily}
          </span>
        </div>
      )}
    </div>
  );
}

function ColorWheel({ hexes }: { hexes: string[] }) {
  const list = hexes.filter(Boolean);
  if (list.length === 0) return null;

  const radius = 70;
  const cx = 90;
  const cy = 90;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="block">
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      {list.map((hex, i) => {
        const angle = (i / list.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        return (
          <g key={i}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <circle
              cx={x}
              cy={y}
              r="16"
              fill={hex}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
            />
          </g>
        );
      })}
      <circle
        cx={cx}
        cy={cy}
        r="6"
        fill="var(--color-card)"
        stroke="var(--color-border)"
      />
    </svg>
  );
}
