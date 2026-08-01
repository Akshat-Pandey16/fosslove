import { cx } from "./cx";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const STEP =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition-all duration-200 ease-out-quint hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft disabled:pointer-events-none disabled:opacity-40";

export function Pagination({
  page,
  pages,
  total,
  unit = "results",
  onChange,
  className,
}: {
  page: number;
  pages: number;
  total?: number | undefined;
  unit?: string | undefined;
  onChange: (page: number) => void;
  className?: string | undefined;
}) {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cx("flex items-center justify-center gap-4", className)}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => {
          onChange(page - 1);
        }}
        className={STEP}
      >
        <ChevronLeftIcon size={18} />
      </button>

      <p aria-live="polite" className="font-mono text-xs tracking-[0.12em] text-ink-muted">
        Page {page} of {pages}
        {total === undefined ? "" : ` · ${total} ${unit}`}
      </p>

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => {
          onChange(page + 1);
        }}
        className={STEP}
      >
        <ChevronRightIcon size={18} />
      </button>
    </nav>
  );
}
