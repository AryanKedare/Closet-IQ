import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ColorSwatch } from "@/components/ColorSwatch";
import { CATEGORIES } from "@/lib/constants";
import { AddItemPanel } from "@/components/AddItemPanel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/closet")({ component: ClosetPage });

type SortKey = "recent" | "most-worn" | "color-family";

function ClosetPage() {
  const items = useStore((s) => s.items);
  const deleteItem = useStore((s) => s.deleteItem);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== "all") list = list.filter((i) => i.category === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q));
    }
    if (sort === "most-worn") list = [...list].sort((a, b) => b.timesWorn - a.timesWorn);
    else if (sort === "color-family") list = [...list].sort((a, b) => a.colorFamily.localeCompare(b.colorFamily));
    else list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [items, filter, sort, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Closet</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} items</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or brands"
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="recent">Recently added</option>
          <option value="most-worn">Most worn</option>
          <option value="color-family">Color family</option>
        </select>
      </div>

      <div className="scrollbar-hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {c}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-2xl">👕</div>
          <div>
            <p className="font-semibold">No items yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap "Add item" to start building your wardrobe.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((it) => (
            <div key={it.id} className="card-surface group flex flex-col p-3">
              <ItemImage item={it} />
              <div className="mt-3 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{it.name}</p>
                <p className="text-xs text-muted-foreground">{it.brand ?? it.category}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <ColorSwatch hex={it.primaryColor} size={14} />
                  {it.secondaryColor && <ColorSwatch hex={it.secondaryColor} size={14} />}
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {it.colorFamily}
                  </span>
                </div>
                {it.styleTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {it.styleTags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  toast(`Delete "${it.name}"?`, {
                    action: {
                      label: "Delete",
                      onClick: () => deleteItem(it.id),
                    },
                    cancel: { label: "Cancel", onClick: () => {} },
                    duration: 5000,
                  });
                }}
                aria-label="Delete"
                className="mt-3 self-end text-muted-foreground/60 transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddItemPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors flex-shrink-0",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
