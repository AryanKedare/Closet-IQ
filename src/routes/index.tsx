import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ColorSwatch } from "@/components/ColorSwatch";
import { ScoreDots } from "@/components/ScoreDots";
import { Wand2, Shirt, Sparkles, Bookmark, Calendar, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const items = useStore((s) => s.items);
  const outfits = useStore((s) => s.outfits);
  const history = useStore((s) => s.history);
  const profile = useStore((s) => s.profile);
  const generate = useStore((s) => s.generate);
  const generating = useStore((s) => s.generating);
  const deleteHistory = useStore((s) => s.deleteHistory);

  const savedCount = outfits.filter((o) => o.isSaved).length;
  const lastWornDate = history[0]?.wornDate;

  const recentlyWorn = history
    .slice(0, 8)
    .map((h) => ({ historyId: h.id, outfit: outfits.find((o) => o.id === h.outfitId) }))
    .filter((x) => x.outfit);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back{profile?.displayName ? `, ${profile.displayName}` : ""}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Your wardrobe, mathematically matched
          </h1>
        </div>
        <button
          onClick={() => generate()}
          disabled={generating || items.length < 3}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Wand2 className="h-4 w-4" />
          {generating ? "Generating…" : "Generate My Outfits"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Shirt} label="Items" value={items.length} />
        <Stat icon={Sparkles} label="Generated outfits" value={outfits.length} />
        <Stat icon={Bookmark} label="Saved" value={savedCount} />
        <Stat
          icon={Calendar}
          label="Last worn"
          value={lastWornDate ? formatDistanceToNow(new Date(lastWornDate), { addSuffix: true }) : "—"}
        />
      </div>

      {/* Recently worn */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Recently worn</h2>
        {recentlyWorn.length === 0 ? (
          <EmptyCard
            title="No outfits worn yet"
            body="Generate your outfits, then mark one as worn to start tracking."
          />
        ) : (
          <div className="scrollbar-hidden -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {recentlyWorn.map(({ historyId, outfit: o }) => {
              if (!o) return null;
              return (
                <div key={historyId} className="relative w-44 flex-shrink-0">
                  <Link
                    to="/outfits/$outfitId"
                    params={{ outfitId: o.id }}
                    className="card-surface block p-3"
                  >
                    <OutfitMiniSwatches outfit={o} />
                    <div className="mt-2">
                      <ScoreDots score={o.compatibilityScore} />
                    </div>
                  </Link>
                  <button
                    onClick={() => deleteHistory(historyId)}
                    aria-label="Remove from history"
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick view of items */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your closet</h2>
          <Link to="/closet" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        {items.length === 0 ? (
          <EmptyCard
            title="Your closet is empty"
            body="Add a few clothing items to start generating outfits."
            cta={{ label: "Add items", to: "/closet" }}
          />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {items.slice(0, 16).map((it) => (
              <Link
                to="/closet"
                key={it.id}
                className="card-surface flex flex-col items-center gap-2 p-3"
              >
                <ColorSwatch hex={it.primaryColor} size={28} />
                <span className="text-center text-[11px] font-medium text-muted-foreground line-clamp-2">
                  {it.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shirt;
  label: string;
  value: string | number;
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function EmptyCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; to: string };
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
      <Sparkles className="h-8 w-8 text-primary/60" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {cta && (
        <Link
          to={cta.to as any}
          className="mt-1 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function OutfitMiniSwatches({ outfit }: { outfit: any }) {
  const items = useStore((s) => s.items);
  const get = (id: string | null) => (id ? items.find((x) => x.id === id) : null);
  const slots = [get(outfit.topId), get(outfit.bottomId), get(outfit.shoesId), get(outfit.jacketId)];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {slots.map((it, i) => (
        <div key={i} className="aspect-square">
          <ItemImage item={it} />
        </div>
      ))}
    </div>
  );
}
