import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ScoreDots } from "@/components/ScoreDots";
import { DEFAULT_PROFILE, OCCASION_FILTERS } from "@/lib/constants";
import { streamExplanation } from "@/lib/groqExplainer";
import type { UserProfile } from "@/lib/types";
import { Bookmark, CheckCircle2, Heart, Info, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/outfits")({ component: OutfitsPage });

const FALLBACK_PROFILE: UserProfile = {
  id: "fallback-profile",
  displayName: "Guest",
  skinToneHex: DEFAULT_PROFILE.skinToneHex,
  eyeColorHex: DEFAULT_PROFILE.eyeColorHex,
  hairColorHex: DEFAULT_PROFILE.hairColorHex,
  skinToneType: DEFAULT_PROFILE.skinToneType,
  stylePreferences: [],
  onboardingCompleted: true,
};

function OutfitsPage() {
  const outfits = useStore((state) => state.outfits);
  const items = useStore((state) => state.items);
  const profile = useStore((state) => state.profile);
  const setExplanation = useStore((state) => state.setExplanation);
  const generate = useStore((state) => state.generate);
  const generating = useStore((state) => state.generating);
  const generationNotice = useStore((state) => state.generationNotice);
  const toggleSaved = useStore((state) => state.toggleSaved);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const markWorn = useStore((state) => state.markWorn);

  const [filter, setFilter] = useState<string>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainErrors, setExplainErrors] = useState<Record<string, string>>({});

  const getItem = (id: string | null) =>
    id ? items.find((item) => item.id === id) ?? null : null;

  const filtered = useMemo(() => {
    let list = outfits;
    if (showSavedOnly) list = list.filter((outfit) => outfit.isSaved);
    if (filter !== "All") {
      list = list.filter((outfit) => outfit.occasionTags.includes(filter));
    }
    return list;
  }, [outfits, filter, showSavedOnly]);

  async function generateOutfits() {
    try {
      await generate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Outfit generation failed");
    }
  }

  async function explainOutfit(outfitId: string) {
    const outfit = outfits.find((candidate) => candidate.id === outfitId);
    if (!outfit) return;

    const top = getItem(outfit.topId);
    const bottom = getItem(outfit.bottomId);
    const shoes = getItem(outfit.shoesId);
    const jacket = getItem(outfit.jacketId);

    if (!top || !bottom || !shoes) {
      setExplainErrors((current) => ({
        ...current,
        [outfitId]: "This outfit is missing a required item.",
      }));
      return;
    }

    setExplainingId(outfitId);
    setExplainErrors((current) => ({ ...current, [outfitId]: "" }));
    setExplanations((current) => ({ ...current, [outfitId]: "" }));

    try {
      const explanation = await streamExplanation({
        top,
        bottom,
        shoes,
        jacket,
        profile: profile ?? FALLBACK_PROFILE,
        onDelta: (chunk) => {
          setExplanations((current) => ({
            ...current,
            [outfitId]: `${current[outfitId] ?? ""}${chunk}`,
          }));
        },
      });

      setExplanations((current) => ({ ...current, [outfitId]: explanation }));
      void setExplanation(outfitId, explanation).catch((error) => {
        console.error("Failed to persist outfit explanation", error);
      });
    } catch (error) {
      setExplainErrors((current) => ({
        ...current,
        [outfitId]: error instanceof Error ? error.message : "Could not generate explanation",
      }));
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
            {outfits.length} combinations · locally validated and AI curated
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
            onClick={() => void generateOutfits()}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {generating ? "AI curating…" : "Generate with AI"}
          </button>
        </div>
      </div>

      {generationNotice && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
            generationNotice.startsWith("AI curated")
              ? "border-primary/20 bg-primary/5 text-foreground"
              : "border-amber-500/30 bg-amber-500/5 text-foreground",
          )}
        >
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p>{generationNotice}</p>
        </div>
      )}

      <div className="scrollbar-hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {OCCASION_FILTERS.map((occasion) => (
          <button
            key={occasion}
            onClick={() => setFilter(occasion)}
            className={cn(
              "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === occasion
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {occasion === "All" ? occasion : occasion.replace("-", " ")}
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
                ? "Generate locally valid combinations and let the AI stylist curate the best set."
                : "Try another occasion filter or regenerate."}
            </p>
          </div>
          {outfits.length === 0 && (
            <button
              onClick={() => void generateOutfits()}
              disabled={generating}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {generating ? "AI curating…" : "Generate with AI"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((outfit) => {
            const top = getItem(outfit.topId);
            const bottom = getItem(outfit.bottomId);
            const shoes = getItem(outfit.shoesId);
            const jacket = getItem(outfit.jacketId);
            const isExplaining = explainingId === outfit.id;
            const explanation = explanations[outfit.id] ?? outfit.aiExplanation ?? "";
            const explainError = explainErrors[outfit.id] ?? "";

            return (
              <div key={outfit.id} className="card-surface flex flex-col p-4">
                <div className="mb-3">
                  <p className="font-semibold">{outfit.name || "AI-curated outfit"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Compatibility {outfit.compatibilityScore}/100
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Slot label="Top" item={top} />
                  <Slot label="Bottom" item={bottom} />
                  <Slot label="Shoes" item={shoes} />
                  <Slot label="Jacket" item={jacket} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <ScoreDots score={outfit.compatibilityScore} />
                  <div className="flex flex-wrap justify-end gap-1">
                    {outfit.occasionTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                      >
                        {tag.replace("-", " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <IconBtn
                      onClick={() => void toggleSaved(outfit.id)}
                      label="Save"
                      active={outfit.isSaved}
                    >
                      <Bookmark className={cn("h-4 w-4", outfit.isSaved && "fill-current")} />
                    </IconBtn>
                    <IconBtn
                      onClick={() => void toggleFavorite(outfit.id)}
                      label="Favorite"
                      active={outfit.isFavorite}
                    >
                      <Heart className={cn("h-4 w-4", outfit.isFavorite && "fill-current")} />
                    </IconBtn>
                    <IconBtn onClick={() => void markWorn(outfit.id)} label="Mark worn">
                      <CheckCircle2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                  <button
                    type="button"
                    onClick={() => void explainOutfit(outfit.id)}
                    disabled={explainingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:cursor-wait disabled:opacity-60"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {isExplaining
                      ? "Generating…"
                      : explanation
                        ? "Regenerate explanation"
                        : "Why this works?"}
                  </button>
                </div>

                {(explanation || explainError) && (
                  <div
                    className={cn(
                      "mt-4 rounded-md border p-3 text-sm leading-relaxed",
                      explainError
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : "border-border bg-muted/40 text-foreground/90",
                    )}
                  >
                    {explainError || explanation}
                    {isExplaining && !explainError && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary" />
                    )}
                  </div>
                )}
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
