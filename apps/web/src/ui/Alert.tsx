import type { ComponentType, ReactNode } from "react";
import { cx } from "./cx";
import { AlertIcon, CheckIcon, InfoIcon, type IconProps } from "./icons";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, string> = {
  info: "border-sky/30 bg-sky-soft text-sky-ink",
  success: "border-moss/30 bg-moss-soft text-moss-ink",
  warning: "border-honey/30 bg-honey-soft text-honey-ink",
  danger: "border-ember/30 bg-ember-soft text-ember-ink",
};

const TONE_ICONS: Record<AlertTone, ComponentType<IconProps>> = {
  info: InfoIcon,
  success: CheckIcon,
  warning: AlertIcon,
  danger: AlertIcon,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone | undefined;
  title?: string | undefined;
  children?: ReactNode;
  className?: string | undefined;
}) {
  const Icon = TONE_ICONS[tone];

  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-lg border p-4 text-sm", TONES[tone], className)}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        {title === undefined ? null : <p className="font-medium leading-snug">{title}</p>}
        {children === undefined ? null : <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
