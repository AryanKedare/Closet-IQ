import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PersonalColorEditor } from "@/components/PersonalColorEditor";
import { parseBodyMeasurements } from "@/lib/bodyMeasurements";
import {
  eyeColorHex,
  generatePersonalPalette,
  hairColorHex,
  isPersonalColorComplete,
  skinToneHex,
  type BodyDetails,
  type PersonalColorAnswers,
} from "@/lib/personalColor";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const DRAFT_KEY = "closetiq-personal-color-onboarding";
const EMPTY_ANSWERS: PersonalColorAnswers = {
  skinTone: null,
  skinUndertone: null,
  hairColor: null,
  eyeColor: null,
  contrastLevel: null,
};
const EMPTY_BODY: BodyDetails = {
  bodyType: "",
  bodyProportions: "",
  shirtSize: "",
  waistInches: "",
  shoeSizeInches: "",
};

function OnboardingPage() {
  const profile = useStore((state) => state.profile);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PersonalColorAnswers>(EMPTY_ANSWERS);
  const [bodyDetails, setBodyDetails] = useState<BodyDetails>(EMPTY_BODY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as {
          step?: number;
          answers?: PersonalColorAnswers;
          bodyDetails?: Partial<BodyDetails> & { wristInches?: string };
        };
        setStep(Math.max(0, Math.min(5, draft.step ?? 0)));
        if (draft.answers) setAnswers({ ...EMPTY_ANSWERS, ...draft.answers });
        if (draft.bodyDetails) {
          setBodyDetails({
            ...EMPTY_BODY,
            ...draft.bodyDetails,
            waistInches: draft.bodyDetails.waistInches ?? draft.bodyDetails.wristInches ?? "",
          });
        }
        return;
      }
    } catch {}

    if (profile) {
      setAnswers({
        skinTone: profile.skinTone ?? null,
        skinUndertone: profile.skinUndertone ?? null,
        hairColor: profile.hairColor ?? null,
        eyeColor: profile.eyeColor ?? null,
        contrastLevel: profile.contrastLevel ?? null,
      });
      setBodyDetails(profile.bodyDetails ?? EMPTY_BODY);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers, bodyDetails }));
    } catch {}
  }, [step, answers, bodyDetails]);

  const selectedForStep = useMemo(() => {
    const keys: Array<keyof PersonalColorAnswers> = [
      "skinTone",
      "skinUndertone",
      "hairColor",
      "eyeColor",
      "contrastLevel",
    ];
    return step < 5 ? Boolean(answers[keys[step]]) : true;
  }, [answers, step]);

  async function finishSetup() {
    if (!profile || !isPersonalColorComplete(answers)) {
      setError("Complete all five colour questions before finishing.");
      return;
    }

    const measurements = parseBodyMeasurements(bodyDetails);
    if (measurements.error) {
      setError(measurements.error);
      return;
    }

    const palette = generatePersonalPalette(answers);
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("user_profile")
      .update({
        skin_tone: answers.skinTone,
        skin_undertone: answers.skinUndertone,
        hair_color: answers.hairColor,
        eye_color: answers.eyeColor,
        contrast_level: answers.contrastLevel,
        recommended_palette: palette.colors.map((color) => color.hex),
        skin_tone_hex: skinToneHex(answers.skinTone),
        hair_color_hex: hairColorHex(answers.hairColor),
        eye_color_hex: eyeColorHex(answers.eyeColor),
        skin_tone_type: answers.skinUndertone,
        body_type: bodyDetails.bodyType.trim() || null,
        body_proportions: bodyDetails.bodyProportions.trim() || null,
        shirt_size: bodyDetails.shirtSize.trim() || null,
        waist_inches: measurements.waistInches,
        shoe_size_inches: measurements.shoeSizeInches,
        onboarding_completed: true,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    window.location.assign("/");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Build your personal colour profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Five quick visual choices create your palette. The final fit details are optional.
          </p>
          <div className="mx-auto mt-5 flex max-w-md gap-1.5">
            {Array.from({ length: 6 }, (_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <PersonalColorEditor
          answers={answers}
          bodyDetails={bodyDetails}
          onAnswersChange={setAnswers}
          onBodyDetailsChange={setBodyDetails}
          step={step}
        />

        {error && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || saving}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(5, current + 1))}
              disabled={!selectedForStep}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void finishSetup()}
              disabled={saving || !isPersonalColorComplete(answers)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Finish setup
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
