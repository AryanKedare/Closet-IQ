import { useMemo } from "react";
import { Check } from "lucide-react";
import {
  CONTRAST_OPTIONS,
  EYE_COLOR_OPTIONS,
  generatePersonalPalette,
  HAIR_COLOR_OPTIONS,
  SKIN_TONE_OPTIONS,
  UNDERTONE_OPTIONS,
  type BodyDetails,
  type PersonalColorAnswers,
} from "@/lib/personalColor";
import { cn } from "@/lib/utils";

type Props = {
  answers: PersonalColorAnswers;
  bodyDetails: BodyDetails;
  onAnswersChange: (answers: PersonalColorAnswers) => void;
  onBodyDetailsChange: (details: BodyDetails) => void;
  step?: number;
  showAll?: boolean;
};

const QUESTIONS = [
  { key: "skinTone", title: "What is your skin tone?", options: SKIN_TONE_OPTIONS },
  { key: "skinUndertone", title: "What is your skin undertone?", options: UNDERTONE_OPTIONS },
  { key: "hairColor", title: "What is your hair colour?", options: HAIR_COLOR_OPTIONS },
  { key: "eyeColor", title: "What is your eye colour?", options: EYE_COLOR_OPTIONS },
  { key: "contrastLevel", title: "How much contrast is there between your features?", options: CONTRAST_OPTIONS },
] as const;

export function PersonalColorEditor({
  answers,
  bodyDetails,
  onAnswersChange,
  onBodyDetailsChange,
  step = 0,
  showAll = false,
}: Props) {
  const palette = useMemo(() => generatePersonalPalette(answers), [answers]);
  const questions = showAll ? QUESTIONS : QUESTIONS.slice(step, step + 1);

  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <section key={question.key} className="card-surface p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {showAll ? question.title : `Question ${step + 1} of 6`}
          </p>
          {!showAll && <h2 className="mt-2 text-2xl font-bold">{question.title}</h2>}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {question.options.map((option) => {
              const selected = answers[question.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onAnswersChange({ ...answers, [question.key]: option.value })}
                  className="group flex flex-col items-center gap-2 text-center"
                  aria-pressed={selected}
                  aria-label={option.label}
                >
                  <span
                    className={cn(
                      "relative block h-16 w-16 rounded-full border-4 shadow-sm transition-all sm:h-20 sm:w-20",
                      selected
                        ? "scale-105 border-primary ring-4 ring-primary/20"
                        : "border-card ring-1 ring-border group-hover:scale-105",
                    )}
                    style={{
                      background: "hex" in option ? option.hex : undefined,
                    }}
                  >
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/15">
                        <Check className="h-6 w-6 text-white drop-shadow" />
                      </span>
                    )}
                  </span>
                  <span className={cn("text-xs leading-tight", selected ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {(showAll || step === 5) && (
        <section className="card-surface p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {showAll ? "Optional sizing details" : "Question 6 of 6 · Optional"}
          </p>
          {!showAll && <h2 className="mt-2 text-2xl font-bold">Tell us about your fit</h2>}
          <p className="mt-2 text-sm text-muted-foreground">
            These details are optional and can improve future fit and proportion recommendations.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Body type" value={bodyDetails.bodyType} placeholder="e.g. rectangle, triangle, oval" onChange={(value) => onBodyDetailsChange({ ...bodyDetails, bodyType: value })} />
            <TextField label="Body proportions" value={bodyDetails.bodyProportions} placeholder="e.g. longer torso, balanced, longer legs" onChange={(value) => onBodyDetailsChange({ ...bodyDetails, bodyProportions: value })} />
            <TextField label="Shirt size" value={bodyDetails.shirtSize} placeholder="e.g. M, L, 40" onChange={(value) => onBodyDetailsChange({ ...bodyDetails, shirtSize: value })} />
            <TextField label="Wrist circumference (inches)" value={bodyDetails.wristInches} placeholder="e.g. 6.8" inputMode="decimal" onChange={(value) => onBodyDetailsChange({ ...bodyDetails, wristInches: value })} />
            <TextField label="Foot length / shoe size (inches)" value={bodyDetails.shoeSizeInches} placeholder="e.g. 10.5" inputMode="decimal" onChange={(value) => onBodyDetailsChange({ ...bodyDetails, shoeSizeInches: value })} />
          </div>
        </section>
      )}

      {(showAll || step >= 4) && (
        <section className="card-surface overflow-hidden p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Recommended palette</p>
          <h3 className="mt-2 text-2xl font-bold">{palette.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{palette.description}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-9">
            {palette.colors.map((color) => (
              <div key={`${color.role}-${color.name}`} className="text-center">
                <div className="aspect-square rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color.hex }} />
                <p className="mt-1.5 text-[11px] font-medium">{color.name}</p>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{color.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TextField({ label, value, placeholder, inputMode, onChange }: { label: string; value: string; placeholder: string; inputMode?: "decimal"; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input value={value} inputMode={inputMode} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </label>
  );
}
