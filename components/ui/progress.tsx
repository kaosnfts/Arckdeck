import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full border border-subtle bg-[rgb(var(--muted)/0.55)]", className)}>
      <div
        className="h-full rounded-full bg-[rgb(var(--primary))]"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
