import { cn } from "@/lib/utils";

// 5 dot indicator: filled teal dots = score / 20 (rounded), grey for the rest.
export function ScoreDots({ score, className }: { score: number; className?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(score / 20)));
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              i < filled ? "bg-primary" : "bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-semibold tabular-nums text-foreground">{score}</span>
    </div>
  );
}
