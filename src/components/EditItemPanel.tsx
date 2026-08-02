import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES,
  COLOR_FAMILIES,
  OCCASION_TAGS,
  PATTERNS,
  SEASONS,
  STYLE_TAGS,
} from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Category, ColorFamily, Pattern, WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function toForm(item: WardrobeItem | null) {
  return {
    name: item?.name ?? "",
    brand: item?.brand ?? "",
    category: (item?.category ?? "shirt") as Category,
    subCategory: item?.subCategory ?? "",
    primaryColor: item?.primaryColor ?? "#808080",
    secondaryColor: item?.secondaryColor ?? "",
    colorFamily: (item?.colorFamily ?? "neutral") as ColorFamily,
    pattern: (item?.pattern ?? "solid") as Pattern,
    styleTags: item?.styleTags ?? [],
    occasionTags: item?.occasionTags ?? [],
    season: item?.season ?? [],
  };
}

export function EditItemPanel({
  item,
  onClose,
}: {
  item: WardrobeItem | null;
  onClose: () => void;
}) {
  const updateItem = useStore((state) => state.updateItem);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => toForm(item));

  useEffect(() => setForm(toForm(item)), [item]);

  if (!item) return null;
  const selectedItem = item;

  function toggle(values: string[], value: string) {
    return values.includes(value)
      ? values.filter((candidate) => candidate !== value)
      : [...values, value];
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await updateItem(selectedItem.id, {
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
      });
      toast.success("Wardrobe item updated");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold">Edit item</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Change any AI-detected or manually entered detail.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Field label="Name">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="edit-input" />
          </Field>
          <Field label="Brand (optional)">
            <input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} className="edit-input" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })} className="edit-input">
                {CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="Sub-category">
              <input value={form.subCategory} onChange={(event) => setForm({ ...form, subCategory: event.target.value })} className="edit-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Primary colour" value={form.primaryColor} onChange={(value) => setForm({ ...form, primaryColor: value })} />
            <ColorField label="Secondary colour" value={form.secondaryColor} optional onChange={(value) => setForm({ ...form, secondaryColor: value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Colour family">
              <select value={form.colorFamily} onChange={(event) => setForm({ ...form, colorFamily: event.target.value as ColorFamily })} className="edit-input">
                {COLOR_FAMILIES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="Pattern">
              <select value={form.pattern} onChange={(event) => setForm({ ...form, pattern: event.target.value as Pattern })} className="edit-input">
                {PATTERNS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Style tags">
            <Chips options={STYLE_TAGS} selected={form.styleTags} onToggle={(value) => setForm({ ...form, styleTags: toggle(form.styleTags, value) })} />
          </Field>
          <Field label="Occasion tags">
            <Chips options={OCCASION_TAGS} selected={form.occasionTags} onToggle={(value) => setForm({ ...form, occasionTags: toggle(form.occasionTags, value) })} />
          </Field>
          <Field label="Seasons">
            <Chips options={SEASONS} selected={form.season} onToggle={(value) => setForm({ ...form, season: toggle(form.season, value) })} />
          </Field>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border p-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button type="button" onClick={() => void save()} disabled={saving || !form.name.trim()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </footer>
      </aside>

      <style>{`.edit-input{width:100%;border-radius:.5rem;border:1px solid var(--color-border);background:var(--color-card);padding:.5rem .75rem;font-size:.875rem}.edit-input:focus{outline:none;border-color:var(--color-primary)}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
}

function ColorField({ label, value, optional, onChange }: { label: string; value: string; optional?: boolean; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#CCCCCC"} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-10 w-10 rounded-md border border-border bg-transparent" />
        <input value={value} placeholder={optional ? "#…" : undefined} onChange={(event) => onChange(event.target.value.toUpperCase())} className="edit-input flex-1" />
      </div>
    </Field>
  );
}

function Chips({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button key={option} type="button" onClick={() => onToggle(option)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium capitalize", selected.includes(option) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{option.replace("-", " ")}</button>
      ))}
    </div>
  );
}
