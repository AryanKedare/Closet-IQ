import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STYLE_TAGS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const profile = useStore((s) => s.profile);
  const [skinColor, setSkinColor] = useState(profile?.skinToneHex || "#CD9581");
  const [eyeColor, setEyeColor] = useState(profile?.eyeColorHex || "#58453B");
  const [hairColor, setHairColor] = useState(profile?.hairColorHex || "#20201F");
  const [styles, setStyles] = useState<string[]>(profile?.stylePreferences ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStyle(tag: string) {
    setStyles((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  async function finishSetup() {
    if (!profile) return;
    if (styles.length === 0) {
      setError("Choose at least one style preference.");
      return;
    }

    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("user_profile")
      .update({
        skin_tone_hex: skinColor,
        eye_color_hex: eyeColor,
        hair_color_hex: hairColor,
        skin_tone_type: "custom",
        style_preferences: styles,
        onboarding_completed: true,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    window.location.assign("/");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Personalize your ClosetIQ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your colour profile and style preferences before continuing.
          </p>
        </div>

        <section className="card-surface p-5 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Colour profile</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <ColorField label="Skin" value={skinColor} onChange={setSkinColor} />
            <ColorField label="Eyes" value={eyeColor} onChange={setEyeColor} />
            <ColorField label="Hair" value={hairColor} onChange={setHairColor} />
          </div>
        </section>

        <section className="card-surface mt-6 p-5 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Style preferences</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleStyle(tag)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  styles.includes(tag)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {tag.replace("-", " ")}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={() => void finishSetup()}
          disabled={saving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Finish setup
        </button>
      </div>
    </main>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-3 flex items-center gap-3">
        <span className="h-16 w-16 flex-shrink-0 rounded-full border border-black/10" style={{ backgroundColor: value }} />
        <div className="flex-1 space-y-2">
          <input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-10 w-full cursor-pointer rounded-md border border-border bg-card" />
          <input value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} pattern="^#[0-9A-Fa-f]{6}$" className="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-sm" />
        </div>
      </div>
    </label>
  );
}
