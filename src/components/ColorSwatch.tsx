import { cn } from "@/lib/utils";

export function ColorSwatch({
  hex,
  size = 16,
  className,
}: {
  hex?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block rounded-full border border-black/10", className)}
      style={{ backgroundColor: hex ?? "#cccccc", width: size, height: size }}
      aria-label={hex ?? "no color"}
    />
  );
}
