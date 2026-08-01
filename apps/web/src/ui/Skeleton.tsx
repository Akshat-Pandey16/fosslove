import { Fragment, type ReactNode } from "react";
import { cx } from "./cx";

export function Skeleton({ className }: { className?: string | undefined }) {
  return (
    <div
      aria-hidden="true"
      className={cx("relative overflow-hidden rounded-md bg-sunken", className)}
    >
      <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,var(--color-line),transparent)] bg-[length:200%_100%]" />
    </div>
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number | undefined;
  className?: string | undefined;
}) {
  return (
    <div aria-hidden="true" className={cx("flex flex-col gap-2.5", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cx("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string | undefined }) {
  return (
    <div
      aria-hidden="true"
      className={cx("rounded-xl border border-line bg-surface p-6 shadow-soft", className)}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4 rounded-full" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="size-8 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 6,
  children,
}: {
  count?: number | undefined;
  children?: ReactNode;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Fragment key={index}>{children ?? <SkeletonCard />}</Fragment>
      ))}
    </>
  );
}
