import { useEffect, useState } from "react";
import { X, Upload, Camera, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  CATEGORIES,
  COLOR_FAMILIES,
  PATTERNS,
  STYLE_TAGS,
  OCCASION_TAGS,
  SEASONS,
} from "@/lib/constants";
import type { Category, ColorFamily, Pattern } from "@/lib/types";
import { ColorSwatch } from "./ColorSwatch";
import { cn } from "@/lib/utils";

export function AddItemPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addItem = useStore((s) => s.addItem);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "shirt" as Category,
    subCategory: "",
    primaryColor: "#1F2D4A",
    secondaryColor: "",
    colorFamily: "cool-blue" as ColorFamily,
    pattern: "solid" as Pattern,
    styleTags: [] as string[],
    occasionTags: [] as string[],
    season: [] as string[],
  });

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function reset() {
    setForm({
      name: "",
      brand: "",
      category: "shirt",
      subCategory: "",
      primaryColor: "#1F2D4A",
      secondaryColor: "",
      colorFamily: "cool-blue",
      pattern: "solid",
      styleTags: [],
      occasionTags: [],
      season: [],
    });
    setFile(null);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await addItem(
        {
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          category: form.category,
          subCategory: form.subCategory.trim() || null,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor || null,
          colorFamily: form.colorFamily,
          pattern: form.pattern,
          styleTags: form.styleTags,
          occasionTags: form.occasionTags,
          season: form.season,
        },
        file ?? undefined
      );
      reset();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add item: " + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggle(arr: string[], value: string) {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  function clearPhoto() {
    setFile(null);
    setPreview(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold">Add a new item</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Photo section */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Photo
            </label>

            {preview ? (
              /* Preview with retake / clear overlay */
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border">
                <img
                  src={preview}
                  alt="Clothing item preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                  {/* Retake via camera */}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30">
                    <Camera className="h-3.5 w-3.5" />
                    Retake
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {/* Replace from gallery */}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {/* Clear */}
                  <button
                    type="button"
                    onClick={clearPhoto}
                    aria-label="Remove photo"
                    className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state — Camera + Upload side by side */
              <div className="grid grid-cols-2 gap-3">
                {/* Take photo with rear camera */}
                <label className="card-surface flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-8 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Camera className="h-7 w-7" />
                  <span className="text-sm font-medium">Take Photo</span>
                  <span className="text-xs opacity-60">Opens camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                {/* Upload from gallery */}
                <label className="card-surface flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-8 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Upload className="h-7 w-7" />
                  <span className="text-sm font-medium">Upload</span>
                  <span className="text-xs opacity-60">From gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}
          </div>

          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Black slim jeans"
              className="input"
            />
          </Field>

          <Field label="Brand (optional)">
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sub-category">
              <input
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                placeholder="e.g. oxford"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-md border border-border bg-transparent"
                />
                <input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </Field>
            <Field label="Secondary (optional)">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor || "#cccccc"}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-md border border-border bg-transparent"
                />
                <input
                  value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  placeholder="#…"
                  className="input flex-1"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color family">
              <select
                value={form.colorFamily}
                onChange={(e) => setForm({ ...form, colorFamily: e.target.value as ColorFamily })}
                className="input"
              >
                {COLOR_FAMILIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pattern">
              <select
                value={form.pattern}
                onChange={(e) => setForm({ ...form, pattern: e.target.value as Pattern })}
                className="input"
              >
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Style tags">
            <ChipGroup
              options={STYLE_TAGS}
              selected={form.styleTags}
              onToggle={(v) => setForm({ ...form, styleTags: toggle(form.styleTags, v) })}
            />
          </Field>

          <Field label="Occasion tags">
            <ChipGroup
              options={OCCASION_TAGS}
              selected={form.occasionTags}
              onToggle={(v) => setForm({ ...form, occasionTags: toggle(form.occasionTags, v) })}
            />
          </Field>

          <Field label="Seasons">
            <ChipGroup
              options={SEASONS}
              selected={form.season}
              onToggle={(v) => setForm({ ...form, season: toggle(form.season, v) })}
            />
          </Field>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || !form.name.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save item"}
          </button>
        </footer>
      </aside>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background-color: var(--color-card);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: var(--color-primary); }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
