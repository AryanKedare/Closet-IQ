import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PersonalColorEditor } from "./PersonalColorEditor";
import { supabase } from "@/integrations/supabase/client";
import { parseBodyMeasurements } from "@/lib/bodyMeasurements";
import { useStore } from "@/lib/store";
import {
  eyeColorHex,
  generatePersonalPalette,
  hairColorHex,
  isPersonalColorComplete,
  skinToneHex,
  type BodyDetails,
  type PersonalColorAnswers,
} from "@/lib/personalColor";

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
  wristInches: "",
  shoeSizeInches: "",
};

export function PersonalColorProfileSection() {
  const profile = useStore((state) => state.profile);
  const loadAll = useStore((state) => state.loadAll);
  const generate = useStore((state) => state.generate);
  const [answers, setAnswers] = useState<PersonalColorAnswers>(EMPTY_ANSWERS);
  const [bodyDetails, setBodyDetails] = useState<BodyDetails>(EMPTY_BODY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setAnswers({
      skinTone: profile.skinTone ?? null,
      skinUndertone: profile.skinUndertone ?? null,
      hairColor: profile.hairColor ?? null,
      eyeColor: profile.eyeColor ?? null,
      contrastLevel: profile.contrastLevel ?? null,
    });
    setBodyDetails(profile.bodyDetails ?? EMPTY_BODY);
  }, [profile]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return JSON.stringify(answers) !== JSON.stringify({
      skinTone: profile.skinTone ?? null,
      skinUndertone: profile.skinUndertone ?? null,
      hairColor: profile.hairColor ?? null,
      eyeColor: profile.eyeColor ?? null,
      contrastLevel: profile.contrastLevel ?? null,
    }) || JSON.stringify(bodyDetails) !== JSON.stringify(profile.bodyDetails ?? EMPTY_BODY);
  }, [answers, bodyDetails, profile]);

  async function save() {
    if (!profile || !isPersonalColorComplete(answers)) {
      toast.error("Select all five personal colour answers before saving.");
      return;
    }

    const measurements = parseBodyMeasurements(bodyDetails);
    if (measurements.error) {
      toast.error(measurements.error);
      return;
    }

    const palette = generatePersonalPalette(answers);
    setSaving(true);
    try {
      const { error } = await supabase
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
        })
        .eq("id", profile.id);
      if (error) throw error;

      await loadAll();
      void generate().catch((error) => console.error("Profile saved, but outfit regeneration failed", error));
      toast.success("Personal colour profile and palette updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update personal colour profile");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Personal colour analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update any trait to recalculate the recommended palette immediately.
        </p>
      </div>
      <PersonalColorEditor
        answers={answers}
        bodyDetails={bodyDetails}
        onAnswersChange={setAnswers}
        onBodyDetailsChange={setBodyDetails}
        showAll
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving || !isPersonalColorComplete(answers)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save personal profile
        </button>
      </div>
    </section>
  );
}
