import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { STYLE_TAGS } from "@/lib/constants";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

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
