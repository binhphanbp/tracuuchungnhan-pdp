import { cn } from "@/lib/utils";

/**
 * A muted shimmer placeholder. Use for loading states while data is being
 * fetched. The animation is provided by Tailwind's `animate-pulse`.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse rounded-md",
        className,
      )}
      {...props}
    />
  );
}
