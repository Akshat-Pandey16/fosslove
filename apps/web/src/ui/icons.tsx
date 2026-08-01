import type { ReactNode } from "react";

export interface IconProps { size?: number; className?: string; strokeWidth?: number }

interface SvgProps {
  size?: number | undefined;
  className?: string | undefined;
  strokeWidth?: number | undefined;
  children: ReactNode;
}

function Svg({
  size,
  className,
  strokeWidth,
  children,
}: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

function Glyph({ size, className, children }: Omit<SvgProps, "strokeWidth">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="10.4" cy="10.4" r="6.6" />
      <path d="M15.3 15.3 20.4 20.4" />
    </Svg>
  );
}

export function WindowsIcon({ size = 20, className }: IconProps) {
  return (
    <Glyph size={size} className={className}>
      <rect x="3" y="4.4" width="7.6" height="7" rx="1.5" />
      <rect x="13.4" y="3" width="7.6" height="8.4" rx="1.5" />
      <rect x="3" y="12.6" width="7.6" height="7" rx="1.5" />
      <rect x="13.4" y="12.6" width="7.6" height="8.4" rx="1.5" />
    </Glyph>
  );
}

export function LinuxIcon({ size = 20, className }: IconProps) {
  return (
    <Glyph size={size} className={className}>
      <path d="M9 19.1c-1.7.5-2.8 1.3-2.6 2.1.2.8 1.7 1.1 3.3.7 1.6-.4 2.7-1.2 2.5-2s-1.6-1.2-3.2-.8Z" />
      <path d="M15 19.1c1.7.5 2.8 1.3 2.6 2.1-.2.8-1.7 1.1-3.3.7-1.6-.4-2.7-1.2-2.5-2s1.6-1.2 3.2-.8Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.2c2.4 0 4.1 1.9 4.1 4.4 0 .8-.1 1.4-.1 1.8 0 .9.7 1.5 1.7 3 1.1 1.6 1.8 3.2 1.8 4.9 0 2.5-2.7 4.1-7.5 4.1s-7.5-1.6-7.5-4.1c0-1.7.7-3.3 1.8-4.9 1-1.5 1.7-2.1 1.7-3 0-.4-.1-1-.1-1.8C7.9 4.1 9.6 2.2 12 2.2Zm-2 3.6a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Zm4 0a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Zm-2 3-1.7 1.3L12 11.5l1.7-1.4L12 8.8Z"
      />
    </Glyph>
  );
}

export function TerminalIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="2.8" y="4" width="18.4" height="16" rx="4" />
      <path d="M7.4 10 10.4 12.4 7.4 14.8" />
      <path d="M13.2 15.2h4.2" />
    </Svg>
  );
}

export function DownloadIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3.4v10.8" />
      <path d="M8.2 10.6 12 14.4 15.8 10.6" />
      <path d="M4.4 16.2v2.2a2.4 2.4 0 0 0 2.4 2.4h10.4a2.4 2.4 0 0 0 2.4-2.4v-2.2" />
    </Svg>
  );
}

export function CopyIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="8.4" y="8.4" width="12.2" height="12.2" rx="3.2" />
      <path d="M16.4 8.4V6.6a3.2 3.2 0 0 0-3.2-3.2H6.6a3.2 3.2 0 0 0-3.2 3.2v6.6a3.2 3.2 0 0 0 3.2 3.2h1.8" />
    </Svg>
  );
}

export function CheckIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M4.6 12.6 9.4 17.4 19.4 6.8" />
    </Svg>
  );
}

export function CloseIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M6.4 6.4 17.6 17.6" />
      <path d="M17.6 6.4 6.4 17.6" />
    </Svg>
  );
}

const HEART_PATH =
  "M12 20.5c-.48 0-.94-.18-1.3-.51l-6.16-5.7C2.36 12.2 2.36 8.66 4.5 6.55a5.2 5.2 0 0 1 7.19-.09l.31.29.31-.29a5.2 5.2 0 0 1 7.19.09c2.14 2.11 2.14 5.65-.04 7.74l-6.16 5.7c-.36.33-.82.51-1.3.51Z";

export function HeartIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d={HEART_PATH} />
    </Svg>
  );
}

export function HeartFilledIcon({ size = 20, className }: IconProps) {
  return (
    <Glyph size={size} className={className}>
      <path d={HEART_PATH} />
    </Glyph>
  );
}

export function PlusIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 5.2v13.6" />
      <path d="M5.2 12h13.6" />
    </Svg>
  );
}

export function MinusIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M5.2 12h13.6" />
    </Svg>
  );
}

export function TrashIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M4 6.8h16" />
      <path d="M9.4 6.8V5.4a2 2 0 0 1 2-2h1.2a2 2 0 0 1 2 2v1.4" />
      <path d="M6.6 6.8l.72 12.06a2.4 2.4 0 0 0 2.4 2.26h4.56a2.4 2.4 0 0 0 2.4-2.26L17.4 6.8" />
      <path d="M10.4 10.8v5.8" />
      <path d="M13.6 10.8v5.8" />
    </Svg>
  );
}

export function PencilIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M4.2 19.8l.86-3.54a2 2 0 0 1 .53-.95L16.2 4.6a2.55 2.55 0 1 1 3.6 3.6L9.06 18.9a2 2 0 0 1-.95.53L4.2 19.8Z" />
      <path d="M15.1 5.7 18.7 9.3" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M14.8 5.6 8.2 12l6.6 6.4" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M9.2 5.6 15.8 12l-6.6 6.4" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M5.6 9.2 12 15.8l6.4-6.6" />
    </Svg>
  );
}

export function ArrowRightIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M3.6 12h16.8" />
      <path d="M14 5.6 20.4 12 14 18.4" />
    </Svg>
  );
}

export function ArrowUpRightIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M6.6 17.4 17.4 6.6" />
      <path d="M8.8 6.6h8.6v8.6" />
    </Svg>
  );
}

export function ExternalLinkIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M13.4 4.4H7a3 3 0 0 0-3 3v9.6a3 3 0 0 0 3 3h9.6a3 3 0 0 0 3-3v-6.4" />
      <path d="M11.6 12.4 19.8 4.2" />
      <path d="M14.4 4.2h5.6v5.6" />
    </Svg>
  );
}

export function PackageIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3.2a2 2 0 0 1 .95.24l6.4 3.44a2 2 0 0 1 1.05 1.76v6.72a2 2 0 0 1-1.05 1.76l-6.4 3.44a2 2 0 0 1-1.9 0l-6.4-3.44A2 2 0 0 1 3.6 15.36V8.64a2 2 0 0 1 1.05-1.76l6.4-3.44A2 2 0 0 1 12 3.2Z" />
      <path d="M3.86 7.7 12 12.1l8.14-4.4" />
      <path d="M12 12.1v8.5" />
    </Svg>
  );
}

export function LayersIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3.2a1.4 1.4 0 0 1 .62.15l6.86 3.4a.9.9 0 0 1 0 1.6l-6.86 3.4a1.4 1.4 0 0 1-1.24 0l-6.86-3.4a.9.9 0 0 1 0-1.6l6.86-3.4A1.4 1.4 0 0 1 12 3.2Z" />
      <path d="M4.1 12.2 11.38 15.8a1.4 1.4 0 0 0 1.24 0l7.28-3.6" />
      <path d="M4.1 16.7 11.38 20.3a1.4 1.4 0 0 0 1.24 0l7.28-3.6" />
    </Svg>
  );
}

export function StarIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3.4a1 1 0 0 1 .9.56l2.24 4.53 5 .73a1 1 0 0 1 .55 1.7l-3.62 3.53.86 4.98a1 1 0 0 1-1.45 1.06L12 17.94l-4.48 2.35a1 1 0 0 1-1.45-1.06l.86-4.98-3.62-3.53a1 1 0 0 1 .55-1.7l5-.73L11.1 3.96a1 1 0 0 1 .9-.56Z" />
    </Svg>
  );
}

export function ShieldIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3.2c.18 0 .35.03.52.09l6.2 2.24a1.6 1.6 0 0 1 1.08 1.5v4.62c0 4.34-2.86 7.5-7.24 9.24a1.6 1.6 0 0 1-1.12 0C7.06 19.15 4.2 15.99 4.2 11.65V7.03a1.6 1.6 0 0 1 1.08-1.5l6.2-2.24c.17-.06.34-.09.52-.09Z" />
      <path d="M9.2 11.9 11.3 14 15 10.2" />
    </Svg>
  );
}

export function SparkleIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M10.4 2.8c.6 3.7 2.2 5.3 5.9 5.9-3.7.6-5.3 2.2-5.9 5.9-.6-3.7-2.2-5.3-5.9-5.9 3.7-.6 5.3-2.2 5.9-5.9Z" />
      <path d="M17.4 14c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3Z" />
    </Svg>
  );
}

export function SunIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="4.3" />
      <path d="M12 2.6v2.1" />
      <path d="M12 19.3v2.1" />
      <path d="M2.6 12h2.1" />
      <path d="M19.3 12h2.1" />
      <path d="M5.35 5.35 6.84 6.84" />
      <path d="M17.16 17.16 18.65 18.65" />
      <path d="M18.65 5.35 17.16 6.84" />
      <path d="M6.84 17.16 5.35 18.65" />
    </Svg>
  );
}

export function MoonIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M20.3 14.7A8.6 8.6 0 0 1 9.3 3.7a8.6 8.6 0 1 0 11 11Z" />
    </Svg>
  );
}

export function MonitorIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="2.8" y="4" width="18.4" height="12.6" rx="3" />
      <path d="M12 16.6v3.8" />
      <path d="M8.4 20.4h7.2" />
    </Svg>
  );
}

export function MenuIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M4 7.2h16" />
      <path d="M4 12h16" />
      <path d="M4 16.8h10.8" />
    </Svg>
  );
}

export function UserIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="8.2" r="3.9" />
      <path d="M4.6 20.5c.55-4.02 3.5-6.3 7.4-6.3s6.85 2.28 7.4 6.3" />
    </Svg>
  );
}

export function LogOutIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M14.6 7.2V6a2.6 2.6 0 0 0-2.6-2.6H6.6A2.6 2.6 0 0 0 4 6v12a2.6 2.6 0 0 0 2.6 2.6H12a2.6 2.6 0 0 0 2.6-2.6v-1.2" />
      <path d="M10 12h10.4" />
      <path d="M17.2 8.8 20.4 12l-3.2 3.2" />
    </Svg>
  );
}

export function SettingsIcon({ size = 20, className }: IconProps) {
  return (
    <Glyph size={size} className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.41 10.66A9.5 9.5 0 0 1 21.41 13.34L19.14 13.94A7.4 7.4 0 0 1 18.42 15.68L19.6 17.7A9.5 9.5 0 0 1 17.7 19.6L15.68 18.42A7.4 7.4 0 0 1 13.94 19.14L13.34 21.41A9.5 9.5 0 0 1 10.66 21.41L10.06 19.14A7.4 7.4 0 0 1 8.32 18.42L6.3 19.6A9.5 9.5 0 0 1 4.4 17.7L5.58 15.68A7.4 7.4 0 0 1 4.86 13.94L2.59 13.34A9.5 9.5 0 0 1 2.59 10.66L4.86 10.06A7.4 7.4 0 0 1 5.58 8.32L4.4 6.3A9.5 9.5 0 0 1 6.3 4.4L8.32 5.58A7.4 7.4 0 0 1 10.06 4.86L10.66 2.59A9.5 9.5 0 0 1 13.34 2.59L13.94 4.86A7.4 7.4 0 0 1 15.68 5.58L17.7 4.4A9.5 9.5 0 0 1 19.6 6.3L18.42 8.32A7.4 7.4 0 0 1 19.14 10.06ZM15.3 12A3.3 3.3 0 1 0 8.7 12A3.3 3.3 0 1 0 15.3 12Z"
      />
    </Glyph>
  );
}

export function SlidersIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M3.6 7.6h9" />
      <path d="M17.6 7.6h2.8" />
      <circle cx="15" cy="7.6" r="2.4" />
      <path d="M3.6 16.4h2.8" />
      <path d="M11.4 16.4h9" />
      <circle cx="9" cy="16.4" r="2.4" />
    </Svg>
  );
}

export function ClockIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.4 2.1" />
    </Svg>
  );
}

export function AlertIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M10.28 4.2 2.9 17a2 2 0 0 0 1.72 3h14.76a2 2 0 0 0 1.72-3L13.72 4.2a2 2 0 0 0-3.44 0Z" />
      <path d="M12 9.8v3.8" />
      <path d="M12 17.1h.01" />
    </Svg>
  );
}

export function InfoIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 11.4v4.8" />
      <path d="M12 8.1h.01" />
    </Svg>
  );
}

export function FolderIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M3.4 7.6a3.2 3.2 0 0 1 3.2-3.2h2.9c.75 0 1.46.35 1.92.94l1.06 1.38h4.9a3.2 3.2 0 0 1 3.2 3.2v6.68a3.2 3.2 0 0 1-3.2 3.2H6.6a3.2 3.2 0 0 1-3.2-3.2Z" />
    </Svg>
  );
}

export function GlobeIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M3.3 12h17.4" />
      <path d="M12 3.2c2.24 2.4 3.5 5.5 3.5 8.8s-1.26 6.4-3.5 8.8c-2.24-2.4-3.5-5.5-3.5-8.8S9.76 5.6 12 3.2Z" />
    </Svg>
  );
}

export function BoltIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M13.2 2.9 5.3 13.05a1 1 0 0 0 .79 1.62h4.02l-.31 6.43 7.9-10.15a1 1 0 0 0-.79-1.62h-4.02Z" />
    </Svg>
  );
}

export function GridIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="3.4" y="3.4" width="7.4" height="7.4" rx="2.4" />
      <rect x="13.2" y="3.4" width="7.4" height="7.4" rx="2.4" />
      <rect x="3.4" y="13.2" width="7.4" height="7.4" rx="2.4" />
      <rect x="13.2" y="13.2" width="7.4" height="7.4" rx="2.4" />
    </Svg>
  );
}

export function ListIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M8.8 6.4h11.6" />
      <path d="M8.8 12h11.6" />
      <path d="M8.8 17.6h11.6" />
      <path d="M4.2 6.4h.01" />
      <path d="M4.2 12h.01" />
      <path d="M4.2 17.6h.01" />
    </Svg>
  );
}

export function RefreshIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M3.8 12a8.2 8.2 0 0 1 13.98-5.8l2.42 2.32" />
      <path d="M20.2 4.3v4.6h-4.6" />
      <path d="M20.2 12a8.2 8.2 0 0 1-13.98 5.8L3.8 15.48" />
      <path d="M3.8 19.7v-4.6h4.6" />
    </Svg>
  );
}

export function UploadIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 14.4V3.6" />
      <path d="M8.2 7.4 12 3.6l3.8 3.8" />
      <path d="M4.4 16.2v2.2a2.4 2.4 0 0 0 2.4 2.4h10.4a2.4 2.4 0 0 0 2.4-2.4v-2.2" />
    </Svg>
  );
}

export function KeyIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="8.2" cy="15.8" r="4.5" />
      <path d="M11.4 12.6 20.4 3.6" />
      <path d="M17.5 6.5 19.7 8.7" />
      <path d="M14.9 9.1 17.1 11.3" />
    </Svg>
  );
}

export function MailIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="2.8" y="4.8" width="18.4" height="14.4" rx="3.6" />
      <path d="M4.6 8.6 10.6 12.8a2.5 2.5 0 0 0 2.8 0l6-4.2" />
    </Svg>
  );
}

export function LockIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="4.4" y="10.2" width="15.2" height="10.4" rx="3.4" />
      <path d="M8 10.2V7.6a4 4 0 0 1 8 0v2.6" />
    </Svg>
  );
}

export function DotsIcon({ size = 20, className }: IconProps) {
  return (
    <Glyph size={size} className={className}>
      <circle cx="5.6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18.4" cy="12" r="1.5" />
    </Glyph>
  );
}

export function FilterIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M3.6 6.1A1.7 1.7 0 0 1 5.2 3.8h13.6a1.7 1.7 0 0 1 1.3 2.8l-5.2 6.16a2 2 0 0 0-.47 1.29v3.63a1.7 1.7 0 0 1-.94 1.52l-2.4 1.2a1.3 1.3 0 0 1-1.88-1.16v-5.19a2 2 0 0 0-.47-1.29L3.9 6.6a1.7 1.7 0 0 1-.3-.5Z" />
    </Svg>
  );
}

export function CommandIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M8.6 3.4a2.7 2.7 0 1 0 2.7 2.7v11.8a2.7 2.7 0 1 1-2.7-2.7h6.8a2.7 2.7 0 1 1-2.7 2.7V6.1a2.7 2.7 0 1 0 2.7 2.7H8.6Z" />
    </Svg>
  );
}

export function FlatpakIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <path d="M12 3.2v17.6" />
      <path d="M3.2 12h8.8" />
    </Svg>
  );
}

export function SnapIcon({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3.4 20.6 12 12 20.6 3.4 12Z" />
      <path d="M12 8.2 15.8 12 12 15.8 8.2 12Z" />
    </Svg>
  );
}

const MANAGER_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  winget: WindowsIcon,
  msstore: WindowsIcon,
  apt: LinuxIcon,
  dnf: LinuxIcon,
  pacman: LinuxIcon,
  flatpak: FlatpakIcon,
  snap: SnapIcon,
  direct: DownloadIcon,
};

export function ManagerIcon({ manager, ...props }: IconProps & { manager: string }) {
  const Icon = MANAGER_ICONS[manager.toLowerCase()] ?? PackageIcon;
  return <Icon {...props} />;
}
