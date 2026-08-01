import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cx } from "./cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "terminal";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "rounded-full font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 ease-out-quint disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-ember text-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0",
  secondary:
    "bg-surface border border-line-strong text-ink shadow-soft hover:border-ember hover:bg-ember-soft/40 hover:-translate-y-0.5 active:translate-y-0",
  ghost: "text-ink hover:bg-sunken",
  danger:
    "bg-berry text-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0",
  terminal:
    "bg-terminal text-terminal-ink shadow-soft hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "className"> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
  loading?: boolean | undefined;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  block?: boolean | undefined;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading = false,
  icon,
  iconEnd,
  block = false,
  type = "button",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      aria-busy={loading ? true : undefined}
      className={cx(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
      {iconEnd}
    </button>
  );
}

export interface LinkButtonProps extends Omit<LinkProps, "className"> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  block?: boolean | undefined;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  icon,
  iconEnd,
  block = false,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={cx(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
      {...rest}
    >
      {icon}
      {children}
      {iconEnd}
    </Link>
  );
}
