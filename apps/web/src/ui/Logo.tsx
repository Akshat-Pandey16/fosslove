import { cx } from "./cx";

const CHIP_PATH =
  "M12 21.4c-.62 0-1.22-.23-1.68-.65L3.9 14.7C1.42 12.4 1.42 8.5 3.86 6.2a5.9 5.9 0 0 1 7.86-.13l.28.25.28-.25a5.9 5.9 0 0 1 7.86.13c2.44 2.3 2.44 6.2-.04 8.5l-6.42 6.05c-.46.42-1.06.65-1.68.65Z";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9.6" className="fill-ember" />
      <g transform="translate(4 4) scale(1)">
        <path d={CHIP_PATH} className="fill-canvas" transform="translate(0 -0.6) scale(1)" />
      </g>
      <path
        d="M11.6 12.9 14.9 15.9 11.6 18.9"
        className="stroke-ember"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.9 19.1h3.5"
        className="stroke-ember"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = 32,
  className,
  wordmark = true,
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span
      aria-label="FOSSLove"
      role="img"
      className={cx("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative inline-flex">
        <span className="pointer-events-none absolute inset-0 rounded-[30%] bg-ember opacity-0 transition-opacity duration-300 group-hover:animate-[fl-pulse-ring_1.2s_var(--ease-out-quint)] motion-reduce:group-hover:animate-none" />
        <LogoMark
          size={size}
          className="relative transition-transform duration-300 ease-spring group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
        />
      </span>
      {wordmark && (
        <span
          className="font-display font-bold tracking-[-0.04em] text-ink"
          style={{ fontSize: `${(size * 0.62).toString()}px` }}
        >
          FOSS<span className="text-ember">Love</span>
        </span>
      )}
    </span>
  );
}
