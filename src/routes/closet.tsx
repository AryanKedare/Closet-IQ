import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ItemImage } from "@/components/ItemImage";
import { ColorSwatch } from "@/components/ColorSwatch";
import { CATEGORIES } from "@/lib/constants";
import { AddItemPanel } from "@/components/AddItemPanel";
import { EditItemPanel } from "@/components/EditItemPanel";
import type { WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/closet")({ component: ClosetPage });

type SortKey = "recent" | "most-worn" | "color-family";

function ClosetPage() {
  const items = useStore((state) => state.items);
  const deleteItem = useStore((state) => state.deleteItem);
  const toggleStored = useStore((state) => state.toggleStored);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");
  const [showStored, setShowStored] = useState(false);

  const activeCount = useMemo(() => items.filter((item) => !item.isStored).length, [items]);
  const storedCount = useMemo(() => items.filter((item) => item.isStored).length, [items]);

  const filtered = useMemo(() => {
    let list = showStored
      ? items.filter((item) => item.isStored)
      : items.filter((item) => !item.isStored);

    if (filter !== "all") list = list.filter((item) => item.category === filter);
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedQuery) ||
          (item.brand ?? "").toLowerCase().includes(normalizedQuery),
      );
    }

    if (sort === "most-worn") {
      list = [...list].sort((a, b) => b.timesWorn - a.timesWorn);
    } else if (sort === "color-family") {
      list = [...list].sort((a, b) => a.colorFamily.localeCompare(b.colorFamily));
    } else {
      list = [...list].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }

    return list;
  }, [items, filter, sort, query, showStored]);

  async function moveItem(item: WardrobeItem) {
    try {
      await toggleStored(item.id);
      toast.success(item.isStored ? "Item restored to active closet" : "Item moved to storage");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update storage status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Closet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active · {storedCount} in storage
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      <div className="grid grid-cols-2 rounded-lg bg-muted p-1 sm:w-80">
        <button
          type="button"
          onClick={() => setShowStored(false)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            !showStored ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setShowStored(true)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            showStored ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Storage ({storedCount})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items or brands"
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
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
        {CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            active={filter === category}
            onClick={() => setFilter(category)}
          >
            {category}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-2xl">{showStored ? "📦" : "👕"}</div>
          <div>
            <p className="font-semibold">
              {showStored ? "Storage is empty" : "No active items found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {showStored
                ? "Items moved to storage will appear here and can be restored at any time."
                : "Add an item or adjust the current filters."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => (
            <div key={item.id} className="card-surface group flex flex-col p-3">
              <ItemImage item={item} />
              <div className="mt-3 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.brand ?? item.category}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <ColorSwatch hex={item.primaryColor} size={14} />
                  {item.secondaryColor && <ColorSwatch hex={item.secondaryColor} size={14} />}
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.colorFamily}
                  </span>
                </div>
                {item.styleTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.styleTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void moveItem(item)}
                  aria-label={item.isStored ? "Restore from storage" : "Move to storage"}
                  title={item.isStored ? "Restore from storage" : "Move to storage"}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.isStored ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  {item.isStored ? "Restore" : "Store"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    aria-label={`Edit ${item.name}`}
                    title="Edit item"
                    className="text-muted-foreground/60 transition-colors hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast(`Delete "${item.name}"?`, {
                        action: {
                          label: "Delete",
                          onClick: () => void deleteItem(item.id),
                        },
                        cancel: { label: "Cancel", onClick: () => {} },
                        duration: 5000,
                      });
                    }}
                    aria-label="Delete"
                    className="text-muted-foreground/60 transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddItemPanel open={open} onClose={() => setOpen(false)} />
      <EditItemPanel item={editingItem} onClose={() => setEditingItem(null)} />
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
        "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
