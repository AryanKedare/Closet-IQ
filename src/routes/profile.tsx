import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { STYLE_TAGS } from "@/lib/constants";
import { Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectColorSeason,
  getSeasonInfo,
  detectArchetypes,
  ARCHETYPE_INFO,
} from "@/lib/colorSeason";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const profile = useStore((s) => s.profile);
  const items = useStore((s) => s.items);
  const outfits = useStore((s) => s.outfits);
  const saveProfile = useStore((s) => s.saveProfile);
  const generate = useStore((s) => s.generate);

  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  if (!profile || !draft) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const dirty =
    draft.displayName !== profile.displayName ||
    draft.skinToneHex !== profile.skinToneHex ||
    draft.eyeColorHex !== profile.eyeColorHex ||
    draft.hairColorHex !== profile.hairColorHex ||
    JSON.stringify(draft.stylePreferences) !== JSON.stringify(profile.stylePreferences);

  const season = useMemo(
    () => getSeasonInfo(detectColorSeason(profile.skinToneHex, profile.eyeColorHex, profile.hairColorHex)),
    [profile.skinToneHex, profile.eyeColorHex, profile.hairColorHex]
  );
  const archetypes = useMemo(() => detectArchetypes(profile.stylePreferences), [profile.stylePreferences]);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveProfile(draft);
      // Re-run engine because skin tone affects scoring.
      await generate();
    } finally {
      setSaving(false);
    }
  }

  function toggleStyle(tag: string) {
    if (!draft) return;
    const next = draft.stylePreferences.includes(tag)
      ? draft.stylePreferences.filter((t) => t !== tag)
      : [...draft.stylePreferences, tag];
    setDraft({ ...draft, stylePreferences: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your skin, eye, and hair colors are baked into every compatibility score.
        </p>
      </div>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identity</h2>
        <div className="mt-4 max-w-md">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Display name
          </label>
          <input
            value={draft.displayName}
            onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Color profile
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          These influence outfit scoring — warm earth tones, navy, and creams get small bonuses; washed-out
          greys are mildly penalized as dominant items.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ColorEditor
            label="Skin"
            value={draft.skinToneHex}
            onChange={(v) => setDraft({ ...draft, skinToneHex: v })}
          />
          <ColorEditor
            label="Eyes"
            value={draft.eyeColorHex}
            onChange={(v) => setDraft({ ...draft, eyeColorHex: v })}
          />
          <ColorEditor
            label="Hair"
            value={draft.hairColorHex}
            onChange={(v) => setDraft({ ...draft, hairColorHex: v })}
          />
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Style preferences
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STYLE_TAGS.map((tag) => {
            const active = draft.stylePreferences.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleStyle(tag)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* Color season */}
      <section className="card-surface p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{season.emoji}</span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Colour season — {season.label}
          </h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {season.undertone}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{season.description}</p>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your best colours</p>
          <div className="flex flex-wrap gap-2">
            {season.bestColorHexes.map((hex, i) => (
              <div key={hex} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span
                  className="block h-4 w-4 flex-shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs font-medium">{season.bestColorNames[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Neutrals:</span> {season.neutrals}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Avoid:</span> {season.avoidNote}
          </p>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          Season is detected from your skin, hair, and eye colours. Update the colour profile above to recalculate.
        </p>
      </section>

      {/* Style archetypes */}
      {archetypes.length > 0 && (
        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Style archetype</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Derived from your style preferences. Most people blend 2–3 archetypes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {archetypes.map((arch, i) => (
              <div
                key={arch}
                className={cn(
                  "flex flex-1 min-w-[200px] flex-col gap-1 rounded-lg border p-4",
                  i === 0
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface-elevated"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ARCHETYPE_INFO[arch].emoji}</span>
                  <span className="font-semibold">{arch}</span>
                  {i === 0 && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      Dominant
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ARCHETYPE_INFO[arch].description}
                </p>
              </div>
            ))}
          </div>
          {profile.stylePreferences.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Select style preferences above to see your archetype.
            </p>
          )}
        </section>
      )}

      {/* Underused items */}
      {(() => {
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const underused = items
          .filter((i) => !i.isStored && (i.timesWorn === 0 || (!i.lastWorn || i.lastWorn < cutoff)))
          .sort((a, b) => a.timesWorn - b.timesWorn)
          .slice(0, 6);
        if (underused.length === 0) return null;
        return (
          <section className="card-surface p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Underused items
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These items haven't been worn in 60+ days (or ever). Generate outfits to find new combos that include them.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {underused.map((it) => (
                <div key={it.id} className="flex flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-border flex-shrink-0">
                    <div
                      className="h-full w-full flex items-center justify-center"
                      style={{ backgroundColor: it.primaryColor + "30" }}
                    >
                      <span
                        className="block h-6 w-6 rounded-full border border-black/10"
                        style={{ backgroundColor: it.primaryColor }}
                      />
                    </div>
                  </div>
                  <p className="text-center text-[10px] font-medium text-muted-foreground line-clamp-2">{it.name}</p>
                  <p className="text-[9px] text-muted-foreground/60">{it.timesWorn} wears</p>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stats</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Items" value={items.length} />
          <Stat label="Outfits" value={outfits.length} />
          <Stat label="Saved" value={outfits.filter((o) => o.isSaved).length} />
          <Stat label="Total wears" value={items.reduce((acc, i) => acc + i.timesWorn, 0)} />
        </div>
      </section>

      <div className="sticky bottom-20 z-10 flex justify-end md:bottom-4">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving & regenerating…" : "Save & regenerate"}
        </button>
      </div>
    </div>
  );
}

function ColorEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <span
          aria-label={`${label} swatch`}
          className="block h-12 w-12 rounded-full border border-black/10 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1 space-y-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-full cursor-pointer rounded-md border border-border bg-transparent"
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-2 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
