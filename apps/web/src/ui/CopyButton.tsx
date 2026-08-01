import { useEffect, useRef, useState } from "react";
import { Button, type ButtonVariant } from "./Button";
import { CheckIcon, CopyIcon } from "./icons";

function readClipboard(): Clipboard | undefined {
  return navigator.clipboard;
}

export function CopyButton({
  value,
  label = "Copy",
  className,
  variant = "ghost",
  size = "sm",
}: {
  value: string;
  label?: string | undefined;
  className?: string | undefined;
  variant?: ButtonVariant | undefined;
  size?: "sm" | "md" | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = () => {
    const clipboard = readClipboard();
    if (clipboard === undefined) return;

    clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        if (timer.current !== undefined) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={copy}
      icon={copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </Button>
  );
}
