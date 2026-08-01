import type { ReactNode } from "react";
import { messageFor } from "@/lib/errors";
import { Alert, EmptyState, PackageIcon } from "@/ui";

export function QueryBoundary({
  isPending,
  error,
  isEmpty = false,
  skeleton,
  empty,
  children,
}: {
  isPending: boolean;
  error: unknown;
  isEmpty?: boolean | undefined;
  skeleton: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (error !== null && error !== undefined) {
    return <Alert tone="danger">{messageFor(error)}</Alert>;
  }

  if (isPending) {
    return (
      <div className="contents" aria-busy="true">
        <span role="status" className="sr-only">
          Loading
        </span>
        {skeleton}
      </div>
    );
  }

  if (isEmpty) {
    return (
      empty ?? (
        <EmptyState
          icon={<PackageIcon size={24} />}
          title="Nothing here yet"
          description="There is nothing to show right now."
        />
      )
    );
  }

  return <>{children}</>;
}
