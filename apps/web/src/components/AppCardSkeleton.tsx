import { Skeleton, cx } from "@/ui";

export function AppCardSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "flex h-full flex-col rounded-xl border border-line bg-surface shadow-soft",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton className={cx("shrink-0 rounded-md", compact ? "size-9" : "size-10")} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className={cx("w-1/2", compact ? "h-4" : "h-5")} />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {compact ? null : (
        <div className="mt-4 flex flex-col gap-2.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-5">
        <Skeleton className="size-1.5 shrink-0 rounded-full" />
        <Skeleton className="h-2.5 w-1/3 rounded-full" />
      </div>
    </div>
  );
}
