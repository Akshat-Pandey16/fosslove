import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Skeleton, cx } from "@/ui";

export interface DataTableColumn {
  key: string;
  label: string;
  className?: string;
  hideLabel?: boolean;
}

const HEAD_CELL =
  "sticky top-0 z-10 whitespace-nowrap border-b border-line bg-sunken px-4 py-3 font-mono text-[0.625rem] font-normal uppercase tracking-[0.18em] text-ink-muted";

export function DataTable({
  columns,
  children,
  className,
  tableClassName,
  scrollable = false,
}: {
  columns: readonly DataTableColumn[];
  children: ReactNode;
  className?: string | undefined;
  tableClassName?: string | undefined;
  scrollable?: boolean | undefined;
}) {
  return (
    <div
      className={cx(
        "overflow-auto rounded-xl border border-line bg-surface shadow-soft",
        scrollable && "max-h-[38rem]",
        className,
      )}
    >
      <table className={cx("w-full min-w-[44rem] border-collapse text-left", tableClassName)}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cx(HEAD_CELL, column.className)}>
                {column.hideLabel === true ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export interface TableRowProps extends ComponentPropsWithoutRef<"tr"> {
  interactive?: boolean | undefined;
}

export function TableRow({ interactive = true, className, children, ...rest }: TableRowProps) {
  return (
    <tr
      className={cx(
        "border-b border-line last:border-b-0",
        interactive && "transition-colors duration-200 hover:bg-sunken/60",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableCell({ className, children, ...rest }: ComponentPropsWithoutRef<"td">) {
  return (
    <td className={cx("px-4 py-3 align-middle text-sm text-ink", className)} {...rest}>
      {children}
    </td>
  );
}

export function TableSkeleton({
  columns,
  rows = 6,
  className,
  tableClassName,
}: {
  columns: readonly DataTableColumn[];
  rows?: number | undefined;
  className?: string | undefined;
  tableClassName?: string | undefined;
}) {
  return (
    <DataTable columns={columns} className={className} tableClassName={tableClassName}>
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row} interactive={false}>
          {columns.map((column, index) => (
            <TableCell key={column.key}>
              <Skeleton className={cx("h-3.5", index === 0 ? "w-40" : "w-20")} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </DataTable>
  );
}
