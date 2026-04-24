import { ColorSwatch } from "./ColorSwatch";
import type { WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ItemImage({
  item,
  className,
  showName = false,
}: {
  item: WardrobeItem | null | undefined;
  className?: string;
  showName?: boolean;
}) {
  if (!item) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-md bg-muted text-2xl text-muted-foreground/40",
          className
        )}
      >
        —
      </div>
    );
  }
  if (item.imageUrl) {
    return (
      <div className={cn("relative aspect-square w-full overflow-hidden rounded-md bg-muted", className)}>
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md",
        className
      )}
      style={{ backgroundColor: item.primaryColor + "20" }}
    >
      <ColorSwatch hex={item.primaryColor} size={32} />
      {showName && (
        <span className="px-2 text-center text-xs text-muted-foreground line-clamp-2">{item.name}</span>
      )}
    </div>
  );
}
